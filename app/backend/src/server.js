const http = require("node:http");
const { createPostgresCheckStore } = require("./postgres-store");

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const REQUEST_TIMEOUT_MS = 5000;
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN ?? "*";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    ...CORS_HEADERS,
  });
  res.end(JSON.stringify(body));
}

function cloneCheck(check) {
  if (!check) {
    return null;
  }

  return {
    ...check,
    latestResult: check.latestResult ? { ...check.latestResult } : null,
  };
}

function createCheckStore() {
  const checks = new Map();
  let nextId = 1;

  return {
    list() {
      return Array.from(checks.values()).map(cloneCheck);
    },
    get(id) {
      return cloneCheck(checks.get(id));
    },
    create(input) {
      const now = new Date().toISOString();
      const check = {
        id: String(nextId++),
        name: input.name,
        url: input.url,
        intervalSeconds: input.intervalSeconds,
        paused: input.paused ?? false,
        createdAt: now,
        updatedAt: now,
        latestResult: null,
      };

      checks.set(check.id, check);
      return cloneCheck(check);
    },
    update(id, input) {
      const existing = checks.get(id);

      if (!existing) {
        return null;
      }

      if (input.name !== undefined) {
        existing.name = input.name;
      }

      if (input.url !== undefined) {
        existing.url = input.url;
      }

      if (input.intervalSeconds !== undefined) {
        existing.intervalSeconds = input.intervalSeconds;
      }

      if (input.paused !== undefined) {
        existing.paused = input.paused;
      }

      existing.updatedAt = new Date().toISOString();
      return cloneCheck(existing);
    },
    remove(id) {
      return checks.delete(id);
    },
    setLatestResult(id, result) {
      const existing = checks.get(id);

      if (!existing) {
        return null;
      }

      existing.latestResult = result;
      existing.updatedAt = new Date().toISOString();
      return cloneCheck(existing);
    },
  };
}

function validateCheckInput(input, { partial = false } = {}) {
  const payload = input && typeof input === "object" ? input : {};
  const errors = [];
  const value = {};

  if (payload.name !== undefined) {
    if (typeof payload.name === "string" && payload.name.trim() !== "") {
      value.name = payload.name.trim();
    } else {
      errors.push("name must be a non-empty string");
    }
  } else if (!partial) {
    errors.push("name is required");
  }

  if (payload.url !== undefined) {
    if (typeof payload.url === "string") {
      try {
        const parsedUrl = new URL(payload.url);

        if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
          value.url = parsedUrl.toString();
        } else {
          errors.push("url must use http or https");
        }
      } catch {
        errors.push("url must be a valid http or https URL");
      }
    } else {
      errors.push("url must be a valid http or https URL");
    }
  } else if (!partial) {
    errors.push("url is required");
  }

  if (payload.intervalSeconds !== undefined) {
    if (Number.isInteger(payload.intervalSeconds) && payload.intervalSeconds > 0) {
      value.intervalSeconds = payload.intervalSeconds;
    } else {
      errors.push("intervalSeconds must be a positive integer");
    }
  } else if (!partial) {
    errors.push("intervalSeconds is required");
  }

  if (payload.paused !== undefined) {
    if (typeof payload.paused === "boolean") {
      value.paused = payload.paused;
    } else {
      errors.push("paused must be a boolean");
    }
  }

  if (partial && Object.keys(value).length === 0) {
    errors.push("at least one field must be provided");
  }

  return { value, errors };
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    const error = new Error("Invalid JSON body");
    error.statusCode = 400;
    throw error;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (rawBody.trim() === "") {
    const error = new Error("Invalid JSON body");
    error.statusCode = 400;
    throw error;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    const error = new Error("Invalid JSON body");
    error.statusCode = 400;
    throw error;
  }
}

function getRoute(requestUrl) {
  const { pathname } = new URL(requestUrl, "http://127.0.0.1");

  if (pathname === "/health") {
    return { type: "health" };
  }

  if (pathname === "/checks") {
    return { type: "checks" };
  }

  const match = pathname.match(/^\/checks\/([^/]+)(?:\/(run|result))?$/);

  if (!match) {
    return { type: "unknown" };
  }

  return {
    type: "check",
    id: decodeURIComponent(match[1]),
    action: match[2] ?? "item",
  };
}

async function runManualCheck(check, fetchImpl = globalThis.fetch, timeoutMs = REQUEST_TIMEOUT_MS) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(check.url, {
      method: "GET",
      signal: controller.signal,
    });

    const durationMs = Date.now() - startedAt;

    return {
      ok: response.ok,
      status: response.ok ? "up" : "down",
      httpStatus: response.status,
      checkedAt: new Date(startedAt).toISOString(),
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    return {
      ok: false,
      status: "down",
      error: controller.signal.aborted ? "Request timed out" : (error?.message ?? "Request failed"),
      checkedAt: new Date(startedAt).toISOString(),
      durationMs,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function createServer({ store, fetchImpl = globalThis.fetch } = {}) {
  const runtimeStore =
    store ?? (process.env.DATABASE_URL ? createPostgresCheckStore({ connectionString: process.env.DATABASE_URL }) : createCheckStore());

  return http.createServer(async (req, res) => {
    try {
      if (req.method === "GET" && getRoute(req.url).type === "health") {
        if (runtimeStore.dependencyStatus) {
          const dependency = runtimeStore.dependencyStatus();
          if (dependency.status !== "up") {
            return json(res, 503, {
              status: "degraded",
              dependencies: { database: { status: dependency.status } },
            });
          }
        }
        return json(res, 200, { status: "ok" });
      }

      if (runtimeStore.ready) {
        await runtimeStore.ready;
      }

      if (req.method === "OPTIONS") {
        res.writeHead(204, CORS_HEADERS);
        return res.end();
      }

      const route = getRoute(req.url);

      if (route.type === "checks") {
        if (req.method === "GET") {
          return json(res, 200, { checks: await runtimeStore.list() });
        }

        if (req.method === "POST") {
          const body = await readJsonBody(req);
          const { value, errors } = validateCheckInput(body);

          if (errors.length > 0) {
            return json(res, 400, { error: "Validation Error", details: errors });
          }

          return json(res, 201, { check: await runtimeStore.create(value) });
        }
      }

      if (route.type === "check") {
        const check = await runtimeStore.get(route.id);

        if (!check) {
          return json(res, 404, { error: "Not Found" });
        }

        if (req.method === "GET" && route.action === "item") {
          return json(res, 200, { check });
        }

        if (req.method === "GET" && route.action === "result") {
          if (!check.latestResult) {
            return json(res, 404, { error: "No result available" });
          }

          return json(res, 200, { result: check.latestResult });
        }

        if (req.method === "PATCH" && route.action === "item") {
          const body = await readJsonBody(req);
          const { value, errors } = validateCheckInput(body, { partial: true });

          if (errors.length > 0) {
            return json(res, 400, { error: "Validation Error", details: errors });
          }

          return json(res, 200, { check: await runtimeStore.update(route.id, value) });
        }

        if (req.method === "DELETE" && route.action === "item") {
          await runtimeStore.remove(route.id);
          res.writeHead(204, CORS_HEADERS);
          return res.end();
        }

        if (req.method === "POST" && route.action === "run") {
          const result = await runManualCheck(check, fetchImpl);
          const updatedCheck = await runtimeStore.setLatestResult(route.id, result);
          return json(res, 200, { check: updatedCheck, result });
        }
      }

      return json(res, 404, { error: "Not Found" });
    } catch (error) {
      if (error?.statusCode === 400) {
        return json(res, 400, { error: error.message });
      }

      if (runtimeStore.dependencyStatus?.().status === "down") {
        return json(res, 503, {
          error: "Dependency Unavailable",
          dependency: "database",
        });
      }
      return json(res, 500, { error: "Internal Server Error" });
    }
  });
}

if (require.main === module) {
  const server = createServer();

  server.listen(DEFAULT_PORT, () => {
    process.stdout.write(`Backend listening on port ${DEFAULT_PORT}\n`);
  });
}

module.exports = {
  createCheckStore,
  createPostgresCheckStore,
  createServer,
  runManualCheck,
  validateCheckInput,
};

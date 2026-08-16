const test = require("node:test");
const assert = require("node:assert/strict");

const { createServer } = require("../src/server");

test("GET /health returns 200 and service status", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.match(response.headers.get("content-type"), /^application\/json\b/);
    assert.deepEqual(body, { status: "ok" });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("unknown path returns 404 error payload", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/missing`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(body, { error: "Not Found" });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("GET /health reports an unavailable database dependency", async () => {
  const ready = Promise.reject(new Error("database unavailable"));
  ready.catch(() => {});
  const server = createServer({
    store: {
      ready,
      dependencyStatus: () => ({ status: "down" }),
    },
  });
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.deepEqual(body, {
      status: "degraded",
      dependencies: { database: { status: "down" } },
    });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

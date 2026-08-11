const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const {
  fetchChecks,
  fetchHealthState,
  initHealthDisplay,
  initUptimeChecks,
  renderCheckList,
  renderHealthState,
} = require("../src/main");
const { createServer } = require("../src/server");
const { createServer: createBackendServer } = require("../../backend/src/server");

test("index page includes minimal health display skeleton", async () => {
  const indexPath = path.resolve(__dirname, "..", "index.html");
  const html = await fs.readFile(indexPath, "utf8");

  assert.match(html, /id="health-status"/);
  assert.match(html, /src="\/src\/main.js"/);
});

test("fetchHealthState returns ok state for healthy backend payload", async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({ status: "ok" }),
  });

  const result = await fetchHealthState(fakeFetch, "http://127.0.0.1:3000");
  assert.deepEqual(result, { ok: true, message: "Backend health: ok" });
});

test("initHealthDisplay updates health status text", async () => {
  const healthNode = {
    textContent: "Checking service health...",
    dataset: {},
  };

  const fakeDocument = {
    getElementById(id) {
      return id === "health-status" ? healthNode : null;
    },
  };

  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({ status: "ok" }),
  });

  await initHealthDisplay({
    fetchImpl: fakeFetch,
    documentRef: fakeDocument,
    backendBaseUrl: "http://127.0.0.1:3000",
  });

  assert.equal(healthNode.textContent, "Backend health: ok");
  assert.equal(healthNode.dataset.state, "ok");
});

test("initHealthDisplay renders healthy state from the backend health endpoint", async () => {
  const backendServer = createBackendServer();
  await new Promise((resolve) => backendServer.listen(0, resolve));

  const healthNode = {
    textContent: "Checking service health...",
    dataset: {},
  };

  const fakeDocument = {
    getElementById(id) {
      return id === "health-status" ? healthNode : null;
    },
  };

  try {
    const { port } = backendServer.address();

    await initHealthDisplay({
      documentRef: fakeDocument,
      backendBaseUrl: `http://127.0.0.1:${port}`,
    });

    assert.equal(healthNode.textContent, "Backend health: ok");
    assert.equal(healthNode.dataset.state, "ok");
  } finally {
    await new Promise((resolve, reject) =>
      backendServer.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("frontend server serves minimal page", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Uptime Monitoring Service/);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("fetchChecks returns the check list from the backend", async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({
      checks: [{ id: "1", name: "Homepage", url: "https://example.com", intervalSeconds: 30, paused: false }],
    }),
  });

  const result = await fetchChecks(fakeFetch, "http://127.0.0.1:3000");

  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Homepage");
});

test("renderCheckList renders the latest result and controls", () => {
  const target = { innerHTML: "" };

  renderCheckList(target, [
    {
      id: "8",
      name: "Status Page",
      url: "https://example.com/health",
      intervalSeconds: 60,
      paused: false,
      latestResult: { ok: true, httpStatus: 200 },
    },
  ]);

  assert.match(target.innerHTML, /Status Page/);
  assert.match(target.innerHTML, /Run now/);
  assert.match(target.innerHTML, /Latest: Up/);
});

test("initUptimeChecks loads checks from the backend and renders them", async () => {
  const listNode = { innerHTML: "", dataset: {}, addEventListener() {} };
  const statusNode = { textContent: "", dataset: {} };
  const formNode = {
    dataset: {},
    addEventListener() {},
    reset() {},
  };
  const refreshButton = { dataset: {}, addEventListener() {} };

  const fakeDocument = {
    getElementById(id) {
      if (id === "checks-list") return listNode;
      if (id === "checks-status") return statusNode;
      if (id === "check-form") return formNode;
      if (id === "refresh-checks") return refreshButton;
      return null;
    },
  };

  const fakeFetch = async (url) => {
    if (url.endsWith("/checks")) {
      return {
        ok: true,
        json: async () => ({
          checks: [{ id: "2", name: "API", url: "https://example.com/api", intervalSeconds: 45, paused: false }],
        }),
      };
    }

    return { ok: true, json: async () => ({}) };
  };

  await initUptimeChecks({
    fetchImpl: fakeFetch,
    documentRef: fakeDocument,
    backendBaseUrl: "http://127.0.0.1:3000",
  });

  assert.match(listNode.innerHTML, /API/);
  assert.match(listNode.innerHTML, /https:\/\/example.com\/api/);
  assert.match(statusNode.textContent, /Showing 1 uptime checks\./);
  assert.match(statusNode.textContent, /In-memory only/);
});

test("renderHealthState marks error state", () => {
  const node = {
    textContent: "",
    dataset: {},
  };

  renderHealthState(node, { ok: false, message: "Backend health: unavailable" });

  assert.equal(node.textContent, "Backend health: unavailable");
  assert.equal(node.dataset.state, "error");
});

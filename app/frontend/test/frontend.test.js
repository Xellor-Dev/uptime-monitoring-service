const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const {
  fetchHealthState,
  renderHealthState,
  initHealthDisplay,
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

test("renderHealthState marks error state", () => {
  const node = {
    textContent: "",
    dataset: {},
  };

  renderHealthState(node, { ok: false, message: "Backend health: unavailable" });

  assert.equal(node.textContent, "Backend health: unavailable");
  assert.equal(node.dataset.state, "error");
});

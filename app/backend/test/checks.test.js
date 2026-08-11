const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createServer,
  runManualCheck,
  validateCheckInput,
} = require("../src/server");

function listen(server) {
  return new Promise((resolve) => server.listen(0, resolve));
}

function close(server) {
  return new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

test("validateCheckInput accepts a valid uptime check payload", () => {
  const { value, errors } = validateCheckInput({
    name: "Example",
    url: "https://example.com/health",
    intervalSeconds: 60,
  });

  assert.deepEqual(errors, []);
  assert.deepEqual(value, {
    name: "Example",
    url: "https://example.com/health",
    intervalSeconds: 60,
  });
});

test("validateCheckInput rejects invalid URL and interval values", () => {
  const { errors } = validateCheckInput({
    name: "Example",
    url: "ftp://example.com",
    intervalSeconds: 0,
  });

  assert.deepEqual(errors, [
    "url must use http or https",
    "intervalSeconds must be a positive integer",
  ]);
});

test("runManualCheck maps successful responses to an up result", async () => {
  const result = await runManualCheck(
    { url: "https://example.com/health" },
    async () => ({
      ok: true,
      status: 200,
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, "up");
  assert.equal(result.httpStatus, 200);
  assert.equal(typeof result.checkedAt, "string");
  assert.equal(typeof result.durationMs, "number");
});

test("runManualCheck maps request failures to a down result", async () => {
  const result = await runManualCheck(
    { url: "https://example.com/health" },
    async () => {
      throw new Error("network unreachable");
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.status, "down");
  assert.equal(result.error, "network unreachable");
});

test("uptime check CRUD and manual run work end to end in memory", async () => {
  const server = createServer({
    fetchImpl: async () => ({
      ok: true,
      status: 200,
    }),
  });

  await listen(server);

  try {
    const { port } = server.address();

    const createdResponse = await fetch(`http://127.0.0.1:${port}/checks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Homepage",
        url: "https://example.com/health",
        intervalSeconds: 30,
      }),
    });
    const createdBody = await createdResponse.json();

    assert.equal(createdResponse.status, 201);
    assert.equal(createdBody.check.name, "Homepage");
    assert.equal(createdBody.check.paused, false);

    const listResponse = await fetch(`http://127.0.0.1:${port}/checks`);
    const listBody = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listBody.checks.length, 1);
    assert.equal(listBody.checks[0].id, createdBody.check.id);

    const updateResponse = await fetch(
      `http://127.0.0.1:${port}/checks/${createdBody.check.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paused: true,
          intervalSeconds: 45,
        }),
      },
    );
    const updateBody = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(updateBody.check.paused, true);
    assert.equal(updateBody.check.intervalSeconds, 45);

    const runResponse = await fetch(
      `http://127.0.0.1:${port}/checks/${createdBody.check.id}/run`,
      { method: "POST" },
    );
    const runBody = await runResponse.json();

    assert.equal(runResponse.status, 200);
    assert.equal(runBody.result.status, "up");
    assert.equal(runBody.check.latestResult.status, "up");

    const resultResponse = await fetch(
      `http://127.0.0.1:${port}/checks/${createdBody.check.id}/result`,
    );
    const resultBody = await resultResponse.json();

    assert.equal(resultResponse.status, 200);
    assert.equal(resultBody.result.status, "up");

    const deleteResponse = await fetch(
      `http://127.0.0.1:${port}/checks/${createdBody.check.id}`,
      { method: "DELETE" },
    );

    assert.equal(deleteResponse.status, 204);

    const missingResponse = await fetch(
      `http://127.0.0.1:${port}/checks/${createdBody.check.id}`,
    );
    const missingBody = await missingResponse.json();

    assert.equal(missingResponse.status, 404);
    assert.deepEqual(missingBody, { error: "Not Found" });
  } finally {
    await close(server);
  }
});

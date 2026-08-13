const test = require("node:test");
const assert = require("node:assert/strict");

const { createPostgresCheckStore } = require("../src/postgres-store");

test("PostgreSQL store initializes its schema and maps persisted checks", async () => {
  const calls = [];
  const timestamp = new Date("2026-01-01T00:00:00.000Z");
  const pool = {
    async query(text, values) {
      calls.push({ text, values });

      if (text.startsWith("INSERT INTO checks")) {
        return {
          rows: [
            {
              id: 7,
              name: "Homepage",
              url: "https://example.com/",
              interval_seconds: 60,
              paused: false,
              created_at: timestamp,
              updated_at: timestamp,
            },
          ],
        };
      }

      if (text.includes("FROM checks")) {
        return {
          rows: [
            {
              id: 7,
              name: "Homepage",
              url: "https://example.com/",
              interval_seconds: 60,
              paused: false,
              created_at: timestamp,
              updated_at: timestamp,
              latest_result: { status: "up" },
            },
          ],
        };
      }

      return { rows: [], rowCount: 0 };
    },
    end: async () => {},
  };

  const store = createPostgresCheckStore({ pool });
  const created = await store.create({
    name: "Homepage",
    url: "https://example.com/",
    intervalSeconds: 60,
  });
  const persisted = await store.get("7");

  assert.equal(calls.some(({ text }) => text.includes("CREATE TABLE IF NOT EXISTS checks")), true);
  assert.equal(calls.some(({ text }) => text.includes("schema_migrations")), true);
  assert.deepEqual(created, {
    id: "7",
    name: "Homepage",
    url: "https://example.com/",
    intervalSeconds: 60,
    paused: false,
    createdAt: timestamp.toISOString(),
    updatedAt: timestamp.toISOString(),
    latestResult: null,
  });
  assert.equal(persisted.latestResult.status, "up");
});

test("PostgreSQL store surfaces schema initialization failures", async () => {
  const error = new Error("database unavailable");
  const pool = {
    query: async () => {
      throw error;
    },
    end: async () => {},
  };

  const store = createPostgresCheckStore({ pool });

  await assert.rejects(store.ready, (cause) => cause === error);
  await assert.rejects(store.list(), (cause) => cause === error);
});

test("PostgreSQL store surfaces repository query failures", async () => {
  const error = new Error("connection lost");
  const pool = {
    async query(text) {
      if (text.includes("CREATE TABLE IF NOT EXISTS")) {
        return { rows: [] };
      }

      throw error;
    },
    end: async () => {},
  };

  const store = createPostgresCheckStore({ pool });

  await assert.rejects(store.list(), (cause) => cause === error);
});

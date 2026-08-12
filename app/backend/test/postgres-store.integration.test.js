const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const { createPostgresCheckStore } = require("../src/postgres-store");

const databaseConfigured = Boolean(process.env.DATABASE_URL);

test(
  "PostgreSQL store preserves checks and latest results across store lifecycles",
  { skip: !databaseConfigured },
  async () => {
    const name = `persistence-${randomUUID()}`;
    const firstStore = createPostgresCheckStore({
      connectionString: process.env.DATABASE_URL,
    });
    let check;

    try {
      check = await firstStore.create({
        name,
        url: "https://example.com/health",
        intervalSeconds: 60,
      });
      await firstStore.setLatestResult(check.id, {
        status: "up",
        httpStatus: 200,
      });
    } finally {
      await firstStore.close();
    }

    const secondStore = createPostgresCheckStore({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      const persisted = await secondStore.get(check.id);

      assert.equal(persisted.id, check.id);
      assert.equal(persisted.name, name);
      assert.deepEqual(persisted.latestResult, {
        status: "up",
        httpStatus: 200,
      });
    } finally {
      await secondStore.remove(check.id);
      await secondStore.close();
    }
  },
);

test(
  "PostgreSQL store rejects values that violate persistence constraints",
  { skip: !databaseConfigured },
  async () => {
    const store = createPostgresCheckStore({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      await assert.rejects(
        store.create({
          name: `invalid-${randomUUID()}`,
          url: "https://example.com/health",
          intervalSeconds: 0,
        }),
        /checks_interval_seconds_check/,
      );
    } finally {
      await store.close();
    }
  },
);

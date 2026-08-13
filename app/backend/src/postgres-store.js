const { Pool } = require("pg");
const { loadMigrations, migrate } = require("./migrations");

function mapCheck(row) {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    name: row.name,
    url: row.url,
    intervalSeconds: row.interval_seconds,
    paused: row.paused,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    latestResult: row.latest_result ?? null,
  };
}

function createPostgresCheckStore({
  pool,
  connectionString,
  schema,
} = {}) {
  pool ??= new Pool({ connectionString: connectionString ?? process.env.DATABASE_URL });
  const migrations = schema ? [{ name: "001_initial.sql", sql: schema }] : loadMigrations();
  let dependencyState = "pending";
  let migrationError;
  const ready = migrate(pool, migrations).then(
    () => {
      dependencyState = "up";
    },
    (error) => {
      dependencyState = "down";
      migrationError = error;
      throw error;
    },
  );

  async function find(id) {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.url, c.interval_seconds, c.paused,
              c.created_at, c.updated_at, r.result AS latest_result
         FROM checks c
         LEFT JOIN check_latest_results r ON r.check_id = c.id
        WHERE c.id = $1`,
      [id],
    );
    return mapCheck(rows[0]);
  }

  return {
    ready,
    dependencyStatus() {
      if (dependencyState === "down") {
        return { status: "down", error: migrationError };
      }
      return { status: dependencyState };
    },
    async list() {
      await ready;
      const { rows } = await pool.query(
        `SELECT c.id, c.name, c.url, c.interval_seconds, c.paused,
                c.created_at, c.updated_at, r.result AS latest_result
           FROM checks c
           LEFT JOIN check_latest_results r ON r.check_id = c.id
          ORDER BY c.id`,
      );
      return rows.map(mapCheck);
    },
    async get(id) {
      await ready;
      return find(id);
    },
    async create(input) {
      await ready;
      const { rows } = await pool.query(
        `INSERT INTO checks (name, url, interval_seconds, paused)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, url, interval_seconds, paused, created_at, updated_at`,
        [input.name, input.url, input.intervalSeconds, input.paused ?? false],
      );
      return mapCheck(rows[0]);
    },
    async update(id, input) {
      await ready;
      const existing = await find(id);
      if (!existing) {
        return null;
      }

      const values = [
        input.name ?? existing.name,
        input.url ?? existing.url,
        input.intervalSeconds ?? existing.intervalSeconds,
        input.paused ?? existing.paused,
        id,
      ];
      const { rows } = await pool.query(
        `UPDATE checks
            SET name = $1, url = $2, interval_seconds = $3, paused = $4,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        RETURNING id, name, url, interval_seconds, paused, created_at, updated_at`,
        values,
      );
      return { ...mapCheck(rows[0]), latestResult: existing.latestResult };
    },
    async remove(id) {
      await ready;
      const result = await pool.query("DELETE FROM checks WHERE id = $1", [id]);
      return result.rowCount > 0;
    },
    async setLatestResult(id, result) {
      await ready;
      const existing = await find(id);
      if (!existing) {
        return null;
      }

      await pool.query(
        `INSERT INTO check_latest_results (check_id, result)
         VALUES ($1, $2)
         ON CONFLICT (check_id) DO UPDATE
           SET result = EXCLUDED.result, updated_at = CURRENT_TIMESTAMP`,
        [id, result],
      );
      await pool.query("UPDATE checks SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
      return { ...existing, latestResult: result, updatedAt: new Date().toISOString() };
    },
    async close() {
      await pool.end();
    },
  };
}

module.exports = { createPostgresCheckStore };

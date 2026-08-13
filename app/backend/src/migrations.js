const fs = require("node:fs");
const path = require("node:path");

const MIGRATIONS_PATH = path.join(__dirname, "..", "migrations");

function loadMigrations(directory = MIGRATIONS_PATH) {
  return fs
    .readdirSync(directory)
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort()
    .map((file) => ({ name: file, sql: fs.readFileSync(path.join(directory, file), "utf8") }));
}

async function migrate(pool, migrations = loadMigrations()) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { rows } = await pool.query("SELECT name FROM schema_migrations ORDER BY name");
  const applied = new Set(rows.map((row) => row.name));

  for (const migration of migrations) {
    if (applied.has(migration.name)) {
      continue;
    }

    await pool.query("BEGIN");
    try {
      await pool.query(migration.sql);
      await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [migration.name]);
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK").catch(() => {});
      throw error;
    }
  }
}

module.exports = { loadMigrations, migrate };

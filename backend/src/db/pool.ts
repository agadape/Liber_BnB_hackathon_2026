import pg from "pg";

let pool: pg.Pool | undefined;

export function databaseConnectionString(env:NodeJS.ProcessEnv=process.env):string|undefined {
  return env.DATABASE_URL || env.DATABASE_POSTGRES_PRISMA_URL || env.DATABASE_POSTGRES_URL;
}

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: databaseConnectionString() });
    pool.on("error", (err) => {
      console.error("Unexpected error on idle Postgres client", err);
    });
  }
  return pool;
}

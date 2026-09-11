import pg from "pg";

if (!process.env.DATABASE_URL) {
  process.loadEnvFile(".env");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;

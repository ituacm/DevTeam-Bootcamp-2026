import pool from "../../db/pool.js";

export const insertUser = async (username, email, password) => {
  const result = await pool.query(
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
    [username, email, password],
  );
  return result.rows[0];
};

export const selectUsers = async () => {
  const result = await pool.query(
    "SELECT id, username, email, created_at FROM users",
  );
  return result.rows;
};

export const selectUserById = async (id) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
};

export const selectUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

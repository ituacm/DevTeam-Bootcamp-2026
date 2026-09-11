import pool from "../../db/pool.js";

export const insertTodo = async (title, description, userId) => {
  const result = await pool.query(
    "INSERT INTO todos (title, description, user_id) VALUES ($1, $2, $3) RETURNING *",
    [title, description, userId],
  );
  return result.rows[0];
};

export const selectTodos = async ({ completed, q } = {}) => {
  const conditions = [];
  const params = [];

  if (typeof completed === "boolean") {
    params.push(completed);
    conditions.push(`completed = $${params.length}`);
  }

  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(title ILIKE $${params.length} OR description ILIKE $${params.length})`,
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(`SELECT * FROM todos ${where}`, params);
  return result.rows;
};

export const selectTodoById = async (id) => {
  const result = await pool.query("SELECT * FROM todos WHERE id = $1", [id]);
  return result.rows[0];
};

export const selectTodosByUserId = async (userId) => {
  const result = await pool.query("SELECT * FROM todos WHERE user_id = $1", [
    userId,
  ]);
  return result.rows;
};

export const replaceTodo = async (id, { title, description, completed }) => {
  const result = await pool.query(
    "UPDATE todos SET title = $1, description = $2, completed = $3 WHERE id = $4 RETURNING *",
    [title, description, completed, id],
  );
  return result.rows[0];
};

export const deleteTodo = async (id) => {
  const result = await pool.query(
    "DELETE FROM todos WHERE id = $1 RETURNING id",
    [id],
  );
  return result.rowCount > 0;
};

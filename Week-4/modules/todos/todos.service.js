import * as todosDB from "./todos.db.js";

export const addTodo = async (title, description, userId = null) => {
  const todo = await todosDB.insertTodo(title, description, userId);
  return publicTodo(todo);
};

export const getTodos = async ({ completed, q } = {}) => {
  const filters = {};

  if (completed === "true" || completed === "false") {
    filters.completed = completed === "true";
  }

  if (typeof q === "string" && q.trim() !== "") {
    filters.q = q.trim();
  }

  const todos = await todosDB.selectTodos(filters);
  return todos.map(publicTodo);
};

export const getTodoById = async (id) => {
  const todo = await todosDB.selectTodoById(id);
  if (!todo) return;
  return publicTodo(todo);
};

export const getTodosByUserId = async (userId) => {
  const todos = await todosDB.selectTodosByUserId(userId);
  return todos.map(publicTodo);
};

export const replaceTodo = async (id, { title, description, completed }) => {
  const todo = await todosDB.replaceTodo(id, { title, description, completed });
  if (!todo) return;
  return publicTodo(todo);
};

export const updateTodo = async (id, alanlar) => {
  const mevcut = await todosDB.selectTodoById(id);
  if (!mevcut) return;

  const title = alanlar.title !== undefined ? alanlar.title : mevcut.title;
  const description =
    alanlar.description !== undefined ? alanlar.description : mevcut.description;
  const completed =
    alanlar.completed !== undefined ? alanlar.completed : mevcut.completed;

  const todo = await todosDB.replaceTodo(id, { title, description, completed });
  return publicTodo(todo);
};

export const deleteTodo = async (id) => {
  return todosDB.deleteTodo(id);
};

/** Veritabanı satırını API sözleşmesine (userId, createdAt) çevirir. */
export const publicTodo = (todo) => ({
  id: todo.id,
  title: todo.title,
  description: todo.description,
  completed: todo.completed,
  userId: todo.userId ?? null,
  createdAt: todo.createdAt,
});

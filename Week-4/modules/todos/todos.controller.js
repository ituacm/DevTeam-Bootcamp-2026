import {
  getTodos,
  addTodo,
  getTodoById,
  replaceTodo,
  updateTodo,
  deleteTodo,
} from "./todos.service.js";

export const getTodosController = async (req, res) => {
  const { completed, q } = req.query;
  res.json(await getTodos({ completed, q }));
};

export const addTodoController = async (req, res) => {
  const { title, description } = req.body;
  const userId =req.user.id;
  const todo = await addTodo(title, description, userId ?? null);
  res.status(201).json(todo);
};

export const getTodoByIdController = async (req, res) => {
  const todo = await getTodoById(req.params.id);
  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }
  // Todo başkasına aitse ve işlemi yapan admin değilse engelle (403)
  if (todo.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Bu içeriği düzenleme yetkiniz yok." });
  }
  res.json(todo);
};

export const replaceTodoController = async (req, res) => {
  const { title, description, completed } = req.body;
  const existingTodo = await getTodoById(req.params.id);
  if (!existingTodo) {
    return res.status(404).json({ error: "Todo not found" });
  }
  // Todo başkasına aitse ve işlemi yapan admin değilse engelle (403)
  if (existingTodo.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Bu içeriği düzenleme yetkiniz yok." });
  }
  const todo = await replaceTodo(req.params.id, {
    title,
    description,
    completed,
  });
  res.json(todo);
};

export const updateTodoController = async (req, res) => {
  const existingTodo = await getTodoById(req.params.id);
  if (!existingTodo) {
    return res.status(404).json({ error: "Todo not found" });
  }
  if (existingTodo.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Bu içeriği düzenleme yetkiniz yok." });
  }
  const updatedTodo = await updateTodo(req.params.id, req.body);
  res.json(updatedTodo);
};

export const deleteTodoController = async (req, res) => {
  const existingTodo = await getTodoById(req.params.id);
  if (!existingTodo) {
    return res.status(404).json({ error: "Todo not found" });
  }
  if (existingTodo.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Bu içeriği düzenleme yetkiniz yok." });
  }
  await deleteTodo(req.params.id);
  res.status(204).send();
};

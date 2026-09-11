import express from "express";
import {
  getTodosController,
  addTodoController,
  getTodoByIdController,
  replaceTodoController,
  updateTodoController,
  deleteTodoController,
} from "./todos.controller.js";
import {
  validateAddTodo,
  validateReplaceTodo,
  validateUpdateTodo,
} from "./todos.validator.js";
import { requireAdmin, verifyAccessToken } from "../../middleware/authMiddleware.js";

const r = express.Router();

r.get("/", verifyAccessToken, getTodosController);
r.post("/", verifyAccessToken, validateAddTodo, addTodoController);

r.get("/:id", verifyAccessToken, getTodoByIdController);
r.put("/:id", verifyAccessToken, validateReplaceTodo, replaceTodoController);
r.patch("/:id", verifyAccessToken, validateUpdateTodo, updateTodoController);
r.delete("/:id", verifyAccessToken, deleteTodoController);

export default r;

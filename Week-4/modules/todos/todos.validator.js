import { z } from "zod";
import { getUserById } from "../users/users.service.js";

// Schemas
const addTodoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  userId: z.number().optional(),
});

const replaceTodoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  completed: z.boolean({ invalid_type_error: "completed must be a boolean" }),
});

const updateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  completed: z.boolean().optional(),
});

// Middleware functions
export const validateAddTodo = async (req, res, next) => {
  // Validate types and shape using Zod
  const result = addTodoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  // If userId is provided, check if the user actually exists in the database
  const { userId } = req.body;
  if (userId) {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
  }

  next();
};

export const validateReplaceTodo = (req, res, next) => {
  const result = replaceTodoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  next();
};

export const validateUpdateTodo = (req, res, next) => {
  // For PATCH: Ensure at least one field is provided
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "At least one field is required" });
  }

  const result = updateTodoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  next();
};

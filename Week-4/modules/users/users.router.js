import express from "express";
import {
  loginUserController,
  registerUserController,
  refreshTokenController,
  getUsersController,
  getUsersTodosController,
} from "./users.controller.js";
import { validateLoginUser, validateRegisterUser } from "./users.validator.js";
import { verifyAccessToken } from "../../middleware/authMiddleware.js";

const r = express.Router();

r.post("/login", validateLoginUser, loginUserController);
r.post("/register", validateRegisterUser, registerUserController);
r.post("/refresh", refreshTokenController);
r.get("/", verifyAccessToken, getUsersController);
r.get("/:id/todos", verifyAccessToken, getUsersTodosController);

export default r;

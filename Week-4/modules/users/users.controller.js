import {
  loginUser,
  registerUser,
  refreshToken,
  getUsers,
  getUserByEmail,
  getUsersTodos,
} from "./users.service.js";

export const loginUserController = async (req, res) => {
  const { email, password } = req.body;

  const result = await loginUser(email, password);

  if (!result) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Refresh Token HttpOnly Cookie olarak ayarlanır
  res.cookie("refreshToken", result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
  });

  res.json({
    accessToken: result.tokens.accessToken,
    user: result.user,
  });
};

export const registerUserController = async (req, res) => {
  const { username, email, password } = req.body;
  if (await getUserByEmail(email)) {
    return res.status(409).json({ error: "email already registered" });
  }
  const result = await registerUser(username, email, password);
  res.cookie("refreshToken", result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
  });
  res.status(201).json({
    accessToken: result.tokens.accessToken,
    user: result.user,
  });
};

export const refreshTokenController = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: "Refresh token is missing" });
  }
  const result = await refreshToken(token);
  if (!result) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
  res.cookie("refreshToken", result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
  });
  res.json({
    accessToken: result.tokens.accessToken,
  });
};

export const getUsersController = async (req, res) => {
  res.json(await getUsers());
};

export const getUsersTodosController = async (req, res) => {
  const todos = await getUsersTodos(req.params.id);
  if (!todos) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(todos);
};

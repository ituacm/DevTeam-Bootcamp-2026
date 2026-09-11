import * as usersDB from "./users.db.js";
import { getTodosByUserId } from "../todos/todos.service.js";
import bcrypt from "bcrypt";
import { generateTokens,verifyRefreshToken } from "../../utils/token.js";

export const loginUser = async (email, password) => {
  const user = await usersDB.selectUserByEmail(email);
  if (!user) {
    return null;
  }
  const secretKey = process.env.PASSWORD_SECRET_KEY || "";
  const isPasswordValid = await bcrypt.compare(password + secretKey, user.password);
  if (!isPasswordValid) {
    return null;
  }
  const tokens = generateTokens(user);
  return {
    tokens,
    user: publicUser(user),
  };
};

export const registerUser = async (username, email, password) => {
  const secretKey = process.env.PASSWORD_SECRET_KEY || "";
  const hash = await bcrypt.hash(password + secretKey, 10);
  const user = await usersDB.insertUser(username, email, hash);
  const tokens = generateTokens(user);
  return {
    tokens,
    user: publicUser(user),
  };
};

export const refreshToken = async (token) => {
  const decodedToken = verifyRefreshToken(token);
  if (!decodedToken) {
    return null;
  }
  const user = await usersDB.selectUserById(decodedToken.id);
  if (!user) {
    return null;
  }
  const tokens = generateTokens(user);
  return {
    tokens,
    user: publicUser(user),
  };
};

export const getUsers = async () => {
  const users = await usersDB.selectUsers();
  return users.map(publicUser);
};

export const getUserById = async (id) => {
  const user = await usersDB.selectUserById(id);
  if (!user) {
    return null;
  }
  const pubUser = publicUser(user);
  return pubUser;
};

export const getUserByEmail = async (email) => {
  const user = await usersDB.selectUserByEmail(email);
  if (!user) {
    return null;
  }
  const pubUser = publicUser(user);
  return pubUser;
};
export const getUsersTodos = async (userId) => {
  const user = await usersDB.selectUserById(userId);
  if (!user) {
    return null;
  }
  return getTodosByUserId(userId);
};
/** password alanini ayiklanmis kopya dondurur. */
export const publicUser = ({ id, username, email, createdAt }) => ({
  id,
  username,
  email,
  createdAt,
});

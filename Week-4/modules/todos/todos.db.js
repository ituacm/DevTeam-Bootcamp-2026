import prisma from "../../db/prisma.js";

// Dönecek alanlar tek yerde dursun — dört fonksiyon aynı şekli döndürsün.
const secim = {
  id: true,
  title: true,
  description: true,
  completed: true,
  userId: true,
  createdAt: true,
};

export const insertTodo = async (title, description, userId) => {
  return await prisma.todo.create({
    data: { title, description, userId },
    select: secim,
  });
};

export const selectTodos = async ({ completed, q } = {}) => {
  const where = {};

  if (typeof completed === "boolean") {
    where.completed = completed;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  return await prisma.todo.findMany({
    where,
    select: secim,
    orderBy: { createdAt: "asc" },
  });
};

export const selectTodoById = async (id) => {
  return await prisma.todo.findUnique({ where: { id }, select: secim });
};

export const selectTodosByUserId = async (userId) => {
  return await prisma.todo.findMany({
    where: { userId },
    select: secim,
    orderBy: { createdAt: "asc" },
  });
};

// update() ve delete() kayıt yoksa HATA FIRLATIR; 404 dönebilmek için
// fırlatmayan updateMany/deleteMany kullanıyoruz.

export const replaceTodo = async (id, { title, description, completed }) => {
  const { count } = await prisma.todo.updateMany({
    where: { id },
    data: { title, description, completed },
  });
  if (count === 0) return undefined;
  return selectTodoById(id);
};

export const deleteTodo = async (id) => {
  const { count } = await prisma.todo.deleteMany({ where: { id } });
  return count > 0;
};

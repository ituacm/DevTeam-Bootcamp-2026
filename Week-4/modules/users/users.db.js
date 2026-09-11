import prisma from "../../db/prisma.js";

// password BURADA YOK: şifre veritabanından hiç okunmuyor.
// Ayıklamayı unutabilirsiniz; çekmediğiniz veriyi sızdıramazsınız.
const secim = {
  id: true,
  username: true,
  email: true,
  createdAt: true,
};

export const insertUser = async (username, email, password) => {
  return await prisma.user.create({
    data: { username, email, password },
    select: secim,
  });
};

export const selectUsers = async () => {
  return await prisma.user.findMany({
    select: secim,
    orderBy: { createdAt: "asc" },
  });
};

export const selectUserById = async (id) => {
  return await prisma.user.findUnique({ where: { id }, select: secim });
};

export const selectUserByEmail = async (email) => {
   return await prisma.user.findUnique({
    where: { email },
  }); // artık sifre hash'ini de çekiyoruz.(login sırasında kontrol edebilmemiz için)
};

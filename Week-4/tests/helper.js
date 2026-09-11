// ⚠️ Bu dosyaya dokunmayın. Testlerin ortak yardımcıları burada.
//
// Uygulamanızı rastgele boş bir portta ayağa kaldırır ve gerçek HTTP
// istekleri atar. Bu yüzden app.js'in listen() ÇAĞIRMAMASI, sadece
// Express uygulamasını export etmesi gerekir.

import app from "../app.js";
import prisma from "../db/prisma.js";

let listener = null;
let base = null;

async function start() {
  if (base) return base;

  // Her test dosyası temiz bir veritabanıyla başlar.
  // Bellekteki dizi her süreçte boş başlıyordu; veritabanı başlamıyor.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "todos", "users" RESTART IDENTITY CASCADE',
  );

  await new Promise((resolve) => {
    listener = app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${listener.address().port}`;
  return base;
}

export async function stop() {
  await prisma.$disconnect();
  if (!listener) return;
  await new Promise((resolve) => listener.close(resolve));
  listener = null;
  base = null;
}

export async function req(method, path, body) {
  const url = (await start()) + path;
  const init = { method, headers: {} };

  if (body !== undefined) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  const text = await res.text();

  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // JSON değil — testler res.text üzerinden bakar
    }
  }

  return { status: res.status, body: json, text, headers: res.headers };
}

export const get = (path) => req("GET", path);
export const post = (path, body) => req("POST", path, body);
export const put = (path, body) => req("PUT", path, body);
export const patch = (path, body) => req("PATCH", path, body);
export const del = (path) => req("DELETE", path);

/** Geçerli bir todo oluşturur, ham yanıtı döndürür. */
export function makeTodo(fields = {}) {
  return post("/todos", {
    title: "test başlığı",
    description: "test açıklaması",
    ...fields,
  });
}

/** Geçerli ve benzersiz bir kullanıcı oluşturur, ham yanıtı döndürür. */
export function makeUser(fields = {}) {
  const n = Math.random().toString(36).slice(2, 10);
  return post("/users", {
    username: `kullanici_${n}`,
    email: `kullanici_${n}@acm.itu.edu.tr`,
    password: "gizli123",
    ...fields,
  });
}

/** Hiçbir kayda ait olmayan, biçimi geçerli bir id. */
export const OLMAYAN_ID = "00000000-0000-4000-8000-000000000000";

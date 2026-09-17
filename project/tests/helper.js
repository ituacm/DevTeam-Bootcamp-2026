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

  // Her test dosyasi TEMIZ bir veritabaniyla baslar.
  //
  // Bellekteki dizi her Node surecinde bos basliyordu; veritabani baslamiyor.
  // Temizlemezsek onceki calistirmadan kalan kayitlar testleri bozar - ozellikle
  // sabit e-posta kullanan testler ikinci calistirmada 409 alir.
  //
  // CASCADE gerekli: todo_tags ve profiles baska tablolara foreign key ile bagli.
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "todo_tags", "profiles", "todos", "tags", "users" RESTART IDENTITY CASCADE',
    );
  } catch (hata) {
    throw new Error(
      `Test veritabanı temizlenemedi. Muhtemelen tablolar henüz oluşmadı.

  1) prisma/schema.prisma içindeki modelleri yazın
  2) npx prisma migrate dev --name init
  3) Aynı şemayı test branch'ine de uygulayın:
     node --env-file=.env.test node_modules/prisma/build/index.js migrate deploy

Orijinal hata: ${hata.message}`,
    );
  }

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

// Test ortamında ortam değişkenleri tanımlı değilse varsayılan değerleri ata
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "devteam-access-secret-32-chars-min-key";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "devteam-refresh-secret-32-chars-min-key";
process.env.PASSWORD_SECRET_KEY = process.env.PASSWORD_SECRET_KEY || "devteam-password-secret-key-salt";

// ─── Otomatik Auth (Geriye dönük uyumluluk) ───────────────────────────
// Ödev 4'te verifyAccessToken middleware'i eklendiğinde eski testler
// (01-todos, 04-filters, 05-priority, 06-profile, 07-tags) token
// göndermeden /todos rotalarına istek atıyor ve 401 alıyor.
//
// Bu mekanizma şöyle çalışır:
//   1. Token'sız bir istek 401 döndürürse, otomatik olarak bir test
//      kullanıcısı register edilir ve access token alınır.
//   2. Aynı istek bu sefer token ile tekrar denenir.
//   3. Token bir kez alındıktan sonra cache'lenir — her istek için
//      yeni kullanıcı oluşturulmaz.
//
// Auth eklenmemiş projelerde (Ödev 3) 401 dönmediği için bu kod hiçbir
// şeyi değiştirmez — tamamen şeffaftır.
// ───────────────────────────────────────────────────────────────────────

let _autoToken = null;

async function _getAutoToken() {
  if (_autoToken) return _autoToken;

  const baseUrl = await start();
  const n = Math.random().toString(36).slice(2, 10);
  const regRes = await fetch(baseUrl + "/users/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: `test_oto_${n}`,
      email: `test_oto_${n}@acm.itu.edu.tr`,
      password: "TestOtoSifre123!",
    }),
  });

  if (!regRes.ok) return null;

  const regBody = await regRes.json();
  _autoToken = regBody?.tokens?.accessToken ?? null;
  return _autoToken;
}

async function _rawReq(method, url, body, headers) {
  const init = { method, headers: { ...headers } };

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

export async function req(method, path, body, authOrHeaders) {
  const url = (await start()) + path;
  const headers = {};

  if (authOrHeaders) {
    if (typeof authOrHeaders === "string") {
      headers["authorization"] = `Bearer ${authOrHeaders}`;
    } else if (typeof authOrHeaders === "object") {
      Object.assign(headers, authOrHeaders);
    }
  }

  const result = await _rawReq(method, url, body, headers);

  // Auth retry: eğer token gönderilmemişse ve 401 döndüyse,
  // otomatik bir test kullanıcısı oluşturup tekrar dene.
  if (result.status === 401 && !authOrHeaders) {
    const token = await _getAutoToken();
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
      return _rawReq(method, url, body, headers);
    }
  }

  return result;
}

export const get = (path) => req("GET", path);
export const post = (path, body) => req("POST", path, body);
export const put = (path, body) => req("PUT", path, body);
export const patch = (path, body) => req("PATCH", path, body);
export const del = (path) => req("DELETE", path);

export const authGet = (path, token) => req("GET", path, undefined, token);
export const authPost = (path, body, token) => req("POST", path, body, token);
export const authPut = (path, body, token) => req("PUT", path, body, token);
export const authPatch = (path, body, token) => req("PATCH", path, body, token);
export const authDel = (path, token) => req("DELETE", path, undefined, token);

// Retry'sız istek fonksiyonları — 401 testleri için (08-auth.test.js).
// Bu fonksiyonlar otomatik auth retry yapmaz; sunucunun döndüğü yanıtı
// olduğu gibi döner. 401 beklenen testlerde kullanılır.
export async function noRetryReq(method, path, body, authOrHeaders) {
  const url = (await start()) + path;
  const headers = {};
  if (authOrHeaders) {
    if (typeof authOrHeaders === "string") {
      headers["authorization"] = `Bearer ${authOrHeaders}`;
    } else if (typeof authOrHeaders === "object") {
      Object.assign(headers, authOrHeaders);
    }
  }
  return _rawReq(method, url, body, headers);
}
export const noRetryGet = (path) => noRetryReq("GET", path);
export const noRetryPost = (path, body) => noRetryReq("POST", path, body);

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

/** Geçerli ve benzersiz bir etiket oluşturur, ham yanıtı döndürür. */
export function makeTag(name) {
  const n = name ?? "etiket_" + Math.random().toString(36).slice(2, 10);
  return post("/tags", { name: n });
}

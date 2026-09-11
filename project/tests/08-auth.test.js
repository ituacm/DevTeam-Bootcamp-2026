// Aşama 4 — Kimlik Doğrulama (Auth), JWT ve Veri İzolasyonu
import { test, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import prisma from "../db/prisma.js";
import {
  get,
  post,
  put,
  del,
  authGet,
  authPost,
  authPut,
  authDel,
  stop,
  OLMAYAN_ID,
} from "./helper.js";

after(stop);

function rastgeleKullanici(ekAlanlar = {}) {
  const n = Math.random().toString(36).slice(2, 10);
  return {
    username: `user_${n}`,
    email: `user_${n}@acm.itu.edu.tr`,
    password: "Password123!",
    ...ekAlanlar,
  };
}

// ──────────────────────────── 1. REGISTER ────────────────────────────

test("POST /users/register → 201, token çifti (accessToken, refreshToken) ve user döner", async () => {
  const k = rastgeleKullanici();
  const res = await post("/users/register", k);

  assert.equal(res.status, 201, "Başarılı kayıt → 201 Created dönmeli.");
  assert.ok(res.body?.tokens, "Yanıtta tokens objesi olmalı.");
  assert.equal(
    typeof res.body.tokens.accessToken,
    "string",
    "tokens içinde accessToken bulunmalı.",
  );
  assert.equal(
    typeof res.body.tokens.refreshToken,
    "string",
    "tokens içinde refreshToken bulunmalı.",
  );
  assert.ok(res.body?.user, "Yanıtta user objesi olmalı.");
  assert.equal(res.body.user.username, k.username);
  assert.equal(res.body.user.email, k.email);
  assert.equal(
    "password" in res.body.user,
    false,
    "password HİÇBİR yanıtta dönmemeli.",
  );
});

test("POST /users/register → şifre veritabanında hash'lenmiş saklanmalı", async () => {
  const k = rastgeleKullanici({ password: "CokGizliSifre987!" });
  const res = await post("/users/register", k);
  assert.equal(res.status, 201);

  // Veritabanındaki ham kaydı kontrol et
  const dbUser = await prisma.user.findUnique({
    where: { email: k.email },
  });

  assert.ok(dbUser, "Kullanıcı veritabanına kaydedilmiş olmalı.");
  assert.notEqual(
    dbUser.password,
    k.password,
    "Şifre veritabanında DÜZ METİN (plain text) olarak saklanamaz! bcrypt ile hash'lenmeli.",
  );

  const secretKey = process.env.PASSWORD_SECRET_KEY || "";
  const eslesiyorMu = await bcrypt.compare(
    k.password + secretKey,
    dbUser.password,
  );
  assert.ok(
    eslesiyorMu,
    "Veritabanındaki hash bcrypt.compare ile doğrulanabilmeli.",
  );
});

test("POST /users/register eksik alan → 400", async () => {
  const sifresiz = await post("/users/register", {
    username: "user_eksik",
    email: "eksik@acm.itu.edu.tr",
  });
  assert.equal(sifresiz.status, 400, "password eksikse 400 dönmeli.");

  const epostasiz = await post("/users/register", {
    username: "user_eksik",
    password: "Password123!",
  });
  assert.equal(epostasiz.status, 400, "email eksikse 400 dönmeli.");
});

test("POST /users/register aynı e-posta ikinci kez → 409", async () => {
  const k = rastgeleKullanici();
  const ilk = await post("/users/register", k);
  assert.equal(ilk.status, 201);

  const ikinci = await post("/users/register", {
    username: "farkli_kullanici",
    email: k.email,
    password: "baska_sifre123",
  });
  assert.equal(
    ikinci.status,
    409,
    "Aynı e-posta ile ikinci kez kayıt olmaya çalışıldığında 409 Conflict dönmeli.",
  );
});

// ───────────────────────────── 2. LOGIN ─────────────────────────────

test("POST /users/login doğru bilgilerle → 200 ve token çifti döner", async () => {
  const k = rastgeleKullanici();
  await post("/users/register", k);

  const loginRes = await post("/users/login", {
    email: k.email,
    password: k.password,
  });

  assert.equal(loginRes.status, 200, "Doğru giriş → 200 OK dönmeli.");
  assert.ok(loginRes.body?.tokens?.accessToken, "Giriş yanıtında accessToken olmalı.");
  assert.ok(loginRes.body?.tokens?.refreshToken, "Giriş yanıtında refreshToken olmalı.");
  assert.equal(loginRes.body?.user?.email, k.email);
});

test("POST /users/login yanlış şifre → 401", async () => {
  const k = rastgeleKullanici();
  await post("/users/register", k);

  const loginRes = await post("/users/login", {
    email: k.email,
    password: "yanlis_sifre_burada",
  });

  assert.equal(
    loginRes.status,
    401,
    "Yanlış şifre girildiğinde 401 Unauthorized dönmeli.",
  );
});

test("POST /users/login kayıtlı olmayan e-posta → 401", async () => {
  const loginRes = await post("/users/login", {
    email: "kayitsiz_biri_123@acm.itu.edu.tr",
    password: "Password123!",
  });

  assert.equal(
    loginRes.status,
    401,
    "Sistemde olmayan e-posta için 401 Unauthorized dönmeli.",
  );
});

// ──────────────────────────── 3. REFRESH ────────────────────────────

test("POST /users/refresh geçerli refreshToken ile → 200 ve yeni token döner", async () => {
  const k = rastgeleKullanici();
  const reg = await post("/users/register", k);
  const refreshToken = reg.body?.tokens?.refreshToken;

  const refreshRes = await post("/users/refresh", { token: refreshToken });

  assert.equal(
    refreshRes.status,
    200,
    "Geçerli refresh token ile yeni access token alınabilmeli.",
  );
  assert.ok(
    refreshRes.body?.tokens?.accessToken,
    "Yanıtta yeni accessToken bulunmalı.",
  );
});

test("POST /users/refresh geçersiz veya bozuk token → 401", async () => {
  const refreshRes = await post("/users/refresh", {
    token: "sahte.veya.bozuk.token",
  });

  assert.equal(
    refreshRes.status,
    401,
    "Geçersiz refresh token için 401 Unauthorized dönmeli.",
  );
});

// ────────────────────── 4. KORUMALI ROTALAR (AUTH) ──────────────────────

test("GET /todos token OLMADAN istek atıldığında → 401", async () => {
  const res = await get("/todos");
  assert.equal(
    res.status,
    401,
    "Authorization başlığı olmadan korumalı rotaya istek atıldığında 401 dönmeli.",
  );
});

test("GET /todos geçersiz / sahte token ile → 401", async () => {
  const res = await authGet("/todos", "bu-gecersiz-bir-jwt-token-stringidir");
  assert.equal(
    res.status,
    401,
    "Sahte veya süresi dolmuş token ile istek atıldığında 401 dönmeli.",
  );
});

test("POST /todos token OLMADAN istek atıldığında → 401", async () => {
  const res = await post("/todos", {
    title: "Yetkisiz todo",
    description: "giriş yapmadan eklenemez",
  });
  assert.equal(
    res.status,
    401,
    "Token olmadan todo oluşturulamaz — 401 dönmeli.",
  );
});

// ──────────────────── 5. VERİ SAHİPLİĞİ VE İZOLASYON ────────────────────

test("POST /todos geçerli token ile → 201 ve userId otomatik atanır", async () => {
  const k = rastgeleKullanici();
  const reg = await post("/users/register", k);
  const token = reg.body?.tokens?.accessToken;
  const userId = reg.body?.user?.id;

  const res = await authPost(
    "/todos",
    {
      title: "Kullanıcıya özel görev",
      description: "userId body'den verilmeyecek, token'dan okunacak",
    },
    token,
  );

  assert.equal(res.status, 201, "Token ile yeni todo oluşturulabilmeli.");
  assert.equal(
    res.body.userId,
    userId,
    "Todo'nun userId alanı, token'ı gönderen kullanıcının id'si olmalı.",
  );
});

test("GET /todos → sadece giriş yapmış kullanıcının kendi todo'larını döner", async () => {
  // 1. Kullanıcı
  const k1 = rastgeleKullanici();
  const reg1 = await post("/users/register", k1);
  const token1 = reg1.body?.tokens?.accessToken;

  // 2. Kullanıcı
  const k2 = rastgeleKullanici();
  const reg2 = await post("/users/register", k2);
  const token2 = reg2.body?.tokens?.accessToken;

  // K1 bir todo ekler
  await authPost(
    "/todos",
    { title: "K1 görevi", description: "sadece K1 görmeli" },
    token1,
  );

  // K2 bir todo ekler
  await authPost(
    "/todos",
    { title: "K2 görevi", description: "sadece K2 görmeli" },
    token2,
  );

  // K1 listeler
  const res1 = await authGet("/todos", token1);
  assert.equal(res1.status, 200);
  assert.ok(
    res1.body.every((t) => t.userId === reg1.body.user.id),
    "Kullanıcı 1 sadece kendi eklediği todo'ları görmeli. Başkasının todoları listelenmemeli.",
  );

  // K2 listeler
  const res2 = await authGet("/todos", token2);
  assert.equal(res2.status, 200);
  assert.ok(
    res2.body.every((t) => t.userId === reg2.body.user.id),
    "Kullanıcı 2 sadece kendi eklediği todo'ları görmeli.",
  );
});

test("Kullanıcı A, Kullanıcı B'nin todo'sunu güncelleyemez (403 veya 404)", async () => {
  const k1 = rastgeleKullanici();
  const reg1 = await post("/users/register", k1);
  const token1 = reg1.body?.tokens?.accessToken;

  const k2 = rastgeleKullanici();
  const reg2 = await post("/users/register", k2);
  const token2 = reg2.body?.tokens?.accessToken;

  // K1 bir todo oluşturur
  const todoRes = await authPost(
    "/todos",
    { title: "K1'in Todo'su", description: "değiştirilemez" },
    token1,
  );
  const todoId = todoRes.body.id;

  // K2, K1'in todo'sunu güncellemeye çalışır
  const guncelleme = await authPut(
    `/todos/${todoId}`,
    {
      title: "Hacker güncellemesi",
      description: "yetkisiz deneme",
      completed: true,
    },
    token2,
  );

  assert.ok(
    [403, 404].includes(guncelleme.status),
    `Başkasına ait bir todo güncellenmeye çalışıldığında 403 Forbidden veya 404 Not Found dönmeli. Gelen: ${guncelleme.status}`,
  );
});

test("Kullanıcı A, Kullanıcı B'nin todo'sunu silemez (403 veya 404)", async () => {
  const k1 = rastgeleKullanici();
  const reg1 = await post("/users/register", k1);
  const token1 = reg1.body?.tokens?.accessToken;

  const k2 = rastgeleKullanici();
  const reg2 = await post("/users/register", k2);
  const token2 = reg2.body?.tokens?.accessToken;

  // K1 bir todo oluşturur
  const todoRes = await authPost(
    "/todos",
    { title: "Silinmeyecek Todo", description: "K1'e ait" },
    token1,
  );
  const todoId = todoRes.body.id;

  // K2 silmeye çalışır
  const silmeRes = await authDel(`/todos/${todoId}`, token2);

  assert.ok(
    [403, 404].includes(silmeRes.status),
    `Başkasına ait bir todo silinmeye çalışıldığında 403 Forbidden veya 404 Not Found dönmeli. Gelen: ${silmeRes.status}`,
  );

  // Todo'nun silinmediğini teyit et
  const kontrol = await authGet(`/todos/${todoId}`, token1);
  assert.equal(
    kontrol.status,
    200,
    "Yetkisiz silme denemesinden sonra asıl sahibinin todo'su silinmemiş olmalı.",
  );
});

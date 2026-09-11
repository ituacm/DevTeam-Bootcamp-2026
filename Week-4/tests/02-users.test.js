// Aşama 2 — users modülü
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { get, post, makeUser, stop } from "./helper.js";

after(stop);

test("POST /users → 201, password yanıtta yok", async () => {
  const res = await post("/users", {
    username: "farhad",
    email: "farhad@acm.itu.edu.tr",
    password: "acmcokyasa123",
  });

  assert.equal(res.status, 201, "Yeni kullanıcı → 201 Created");
  assert.equal(typeof res.body?.id, "string", "Yanıtta string bir id olmalı.");
  assert.equal(res.body.username, "farhad");
  assert.equal(res.body.email, "farhad@acm.itu.edu.tr");
  assert.equal(
    "password" in res.body,
    false,
    "password HİÇBİR yanıtta dönmemeli.",
  );
});

test("POST /users eksik alan → 400", async () => {
  const sifresiz = await post("/users", {
    username: "a",
    email: "a@b.com",
  });
  assert.equal(sifresiz.status, 400, "password yoksa 400 dönmeli.");

  const kullanicisiz = await post("/users", {
    email: "a@b.com",
    password: "123456",
  });
  assert.equal(kullanicisiz.status, 400, "username yoksa 400 dönmeli.");
});

test("POST /users geçersiz e-posta → 400", async () => {
  const res = await post("/users", {
    username: "bozukmail",
    email: "acm-nokta-com",
    password: "123456",
  });
  assert.equal(res.status, 400, "'@' içermeyen e-posta 400 dönmeli.");
});

test("POST /users aynı e-posta ikinci kez → 409", async () => {
  const email = "tekrar@acm.itu.edu.tr";

  const ilk = await post("/users", {
    username: "ilk",
    email,
    password: "123456",
  });
  assert.equal(ilk.status, 201);

  const ikinci = await post("/users", {
    username: "ikinci",
    email,
    password: "123456",
  });
  assert.equal(
    ikinci.status,
    409,
    "Kayıtlı e-posta ile tekrar kayıt → 409 Conflict. " +
      "Bu bir doğrulama hatası değil, mevcut durumla çakışmadır.",
  );
});

test("GET /users → 200, hiçbir kayıtta password yok", async () => {
  await makeUser();
  await makeUser();

  const res = await get("/users");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body), "Yanıt bir dizi olmalı.");
  assert.ok(res.body.length >= 2, "Oluşturulan kullanıcılar listede olmalı.");

  for (const user of res.body) {
    assert.equal(
      "password" in user,
      false,
      "Listede dönen hiçbir kullanıcıda password alanı bulunmamalı.",
    );
  }
});

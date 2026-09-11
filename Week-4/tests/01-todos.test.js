// Aşama 1 — todos modülünün tamamlanması
import { test, after } from "node:test";
import assert from "node:assert/strict";
import {
  get,
  post,
  put,
  patch,
  del,
  makeTodo,
  stop,
  OLMAYAN_ID,
} from "./helper.js";

after(stop);

test("POST /todos → 201 ve oluşan kayıt", async () => {
  const res = await post("/todos", {
    title: "Ödevi bitir",
    description: "Hafta 2 REST API",
  });

  assert.equal(res.status, 201, "Yeni kaynak oluşturuldu → 201 Created");
  assert.equal(typeof res.body?.id, "string", "Yanıtta string bir id olmalı.");
  assert.equal(res.body.title, "Ödevi bitir");
  assert.equal(res.body.description, "Hafta 2 REST API");
  assert.equal(
    res.body.completed,
    false,
    "completed gönderilmediyse varsayılan false olmalı.",
  );
});

test("POST /todos eksik/hatalı gövde → 400", async () => {
  const eksikTitle = await post("/todos", { description: "başlıksız" });
  assert.equal(eksikTitle.status, 400, "title yoksa 400 dönmeli.");

  const eksikDescription = await post("/todos", { title: "açıklamasız" });
  assert.equal(eksikDescription.status, 400, "description yoksa 400 dönmeli.");

  const yanlisTip = await post("/todos", { title: 42, description: "x" });
  assert.equal(yanlisTip.status, 400, "title string değilse 400 dönmeli.");
});

test("GET /todos → 200 ve dizi", async () => {
  await makeTodo({ title: "listede görünmeli" });

  const res = await get("/todos");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body), "Yanıt bir dizi olmalı.");
  assert.ok(
    res.body.some((t) => t.title === "listede görünmeli"),
    "Oluşturulan todo listede yer almalı.",
  );
});

test("GET /todos/:id → 200, olmayan id → 404", async () => {
  const olusan = await makeTodo({ title: "tek kayıt" });
  const id = olusan.body.id;

  const bulunan = await get(`/todos/${id}`);
  assert.equal(bulunan.status, 200);
  assert.equal(bulunan.body.id, id);
  assert.equal(bulunan.body.title, "tek kayıt");

  const yok = await get(`/todos/${OLMAYAN_ID}`);
  assert.equal(yok.status, 404, "Olmayan id için 404 dönmeli.");
});

test("PUT /todos/:id → 200, id korunur, alanlar değişir", async () => {
  const olusan = await makeTodo({ title: "eski", description: "eski açıklama" });
  const id = olusan.body.id;

  const res = await put(`/todos/${id}`, {
    title: "yeni",
    description: "yeni açıklama",
    completed: true,
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.id, id, "PUT aynı id'yi korumalı, yeni id üretmemeli.");
  assert.equal(res.body.title, "yeni");
  assert.equal(res.body.description, "yeni açıklama");
  assert.equal(res.body.completed, true);
});

test("PUT /todos/:id eksik alan → 400", async () => {
  const olusan = await makeTodo();
  const id = olusan.body.id;

  const res = await put(`/todos/${id}`, { title: "sadece başlık" });
  assert.equal(
    res.status,
    400,
    "PUT tam güncellemedir: title, description ve completed'ın üçü de zorunlu.",
  );
});

test("PUT /todos/:id olmayan id → 404", async () => {
  // Önce route'un gerçekten var olduğunu doğrula: aksi hâlde bu test,
  // notFoundHandler'ın döndürdüğü 404 yüzünden bedava geçerdi.
  const olusan = await makeTodo();
  const calisan = await put(`/todos/${olusan.body.id}`, {
    title: "a",
    description: "b",
    completed: false,
  });
  assert.equal(calisan.status, 200, "Önce PUT /todos/:id route'unu ekleyin.");

  const res = await put(`/todos/${OLMAYAN_ID}`, {
    title: "a",
    description: "b",
    completed: false,
  });
  assert.equal(res.status, 404);
});

test("PATCH /todos/:id → 200, sadece gönderilen alan değişir", async () => {
  const olusan = await makeTodo({
    title: "dokunulmasın",
    description: "bu da dursun",
  });
  const id = olusan.body.id;

  const res = await patch(`/todos/${id}`, { completed: true });

  assert.equal(res.status, 200);
  assert.equal(res.body.id, id);
  assert.equal(res.body.completed, true);
  assert.equal(
    res.body.title,
    "dokunulmasın",
    "PATCH kısmi güncellemedir — gönderilmeyen alanlar korunmalı.",
  );
  assert.equal(res.body.description, "bu da dursun");
});

test("PATCH /todos/:id boş gövde → 400", async () => {
  const olusan = await makeTodo();
  const res = await patch(`/todos/${olusan.body.id}`, {});
  assert.equal(
    res.status,
    400,
    "PATCH'te en az bir alan gönderilmiş olmalı; boş gövde 400 dönmeli.",
  );
});

test("PATCH /todos/:id olmayan id → 404", async () => {
  const olusan = await makeTodo();
  const calisan = await patch(`/todos/${olusan.body.id}`, { completed: true });
  assert.equal(calisan.status, 200, "Önce PATCH /todos/:id route'unu ekleyin.");

  const res = await patch(`/todos/${OLMAYAN_ID}`, { completed: true });
  assert.equal(res.status, 404);
});

test("DELETE /todos/:id → 204 ve gövdesiz", async () => {
  const olusan = await makeTodo({ title: "silinecek" });
  const id = olusan.body.id;

  const res = await del(`/todos/${id}`);
  assert.equal(res.status, 204, "Başarılı silme 204 No Content dönmeli.");
  assert.equal(res.text, "", "204 yanıtının gövdesi boş olmak zorundadır.");

  const sonra = await get(`/todos/${id}`);
  assert.equal(sonra.status, 404, "Silinen kayıt artık bulunmamalı.");
});

test("DELETE /todos/:id olmayan id → 404", async () => {
  const olusan = await makeTodo();
  const calisan = await del(`/todos/${olusan.body.id}`);
  assert.equal(
    calisan.status,
    204,
    "Önce DELETE /todos/:id route'unu ekleyin.",
  );

  const res = await del(`/todos/${OLMAYAN_ID}`);
  assert.equal(res.status, 404);
});

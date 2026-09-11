// Aşama 3 — modüller arası ilişki
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { get, post, makeUser, makeTodo, stop, OLMAYAN_ID } from "./helper.js";

after(stop);

test("POST /todos geçerli userId ile → 201 ve userId saklanır", async () => {
  const user = await makeUser();
  assert.equal(user.status, 201, "Önce Aşama 2'yi tamamlayın.");

  const res = await post("/todos", {
    title: "sahipli todo",
    description: "bir kullanıcıya ait",
    userId: user.body.id,
  });

  assert.equal(res.status, 201);
  assert.equal(
    res.body.userId,
    user.body.id,
    "Gönderilen userId todo üzerinde saklanmalı.",
  );
});

test("POST /todos olmayan userId ile → 400", async () => {
  const res = await post("/todos", {
    title: "hayalet sahip",
    description: "böyle bir kullanıcı yok",
    userId: OLMAYAN_ID,
  });

  assert.equal(
    res.status,
    400,
    "userId gönderildiyse gerçekten var olan bir kullanıcıyı göstermeli. " +
      "Bu kontrol için todos katmanı users modülünün SERVICE'ini çağırmalı.",
  );
});

test("POST /todos userId olmadan → 201 (userId isteğe bağlı)", async () => {
  const res = await makeTodo({ title: "sahipsiz todo" });
  assert.equal(res.status, 201, "userId zorunlu değildir, gönderilmeyebilir.");
});

test("GET /users/:id/todos → 200 ve yalnızca o kullanıcının todoları", async () => {
  const ali = await makeUser();
  const veli = await makeUser();

  await post("/todos", {
    title: "ali-1",
    description: "x",
    userId: ali.body.id,
  });
  await post("/todos", {
    title: "ali-2",
    description: "x",
    userId: ali.body.id,
  });
  await post("/todos", {
    title: "veli-1",
    description: "x",
    userId: veli.body.id,
  });
  await makeTodo({ title: "sahipsiz" });

  const res = await get(`/users/${ali.body.id}/todos`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body), "Yanıt bir dizi olmalı.");
  assert.equal(
    res.body.length,
    2,
    "Yalnızca o kullanıcıya ait todolar dönmeli — sahipsizler ve başkasının todoları dahil edilmemeli.",
  );
  for (const todo of res.body) {
    assert.equal(todo.userId, ali.body.id);
  }
});

test("GET /users/:id/todos olmayan kullanıcı → 404", async () => {
  // Route'un var olduğunu önce doğrula — yoksa bu test notFoundHandler
  // sayesinde bedava geçerdi.
  const user = await makeUser();
  const calisan = await get(`/users/${user.body.id}/todos`);
  assert.equal(
    calisan.status,
    200,
    "Önce GET /users/:id/todos route'unu ekleyin.",
  );

  const res = await get(`/users/${OLMAYAN_ID}/todos`);
  assert.equal(
    res.status,
    404,
    "Kullanıcı yoksa boş dizi değil 404 dönmeli — kaynak mevcut değil.",
  );
});

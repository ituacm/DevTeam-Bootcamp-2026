// Aşama 0 — ısınma: middleware sırası
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { get, stop } from "./helper.js";

after(stop);

test("GET / → 200 ve 'Hello World'", async () => {
  const res = await get("/");
  assert.equal(
    res.status,
    200,
    "GET / şu an 404 dönüyor olabilir. app.js'te middleware sırasına bakın: " +
      "notFoundHandler her yolu yakalar, kendisinden sonra tanımlanan " +
      "route'lara sıra hiç gelmez.",
  );
  assert.match(res.text, /hello world/i, "Gövde 'Hello World' içermeli.");
});

test("tanımsız yol → 404 ve JSON gövde", async () => {
  const res = await get("/boyle-bir-yol-yok");
  assert.equal(res.status, 404, "Tanımsız yol 404 dönmeli.");
  assert.ok(
    res.body && typeof res.body === "object",
    "404 yanıtı HTML değil JSON olmalı — API'nin her yanıtı JSON olmalı.",
  );
});

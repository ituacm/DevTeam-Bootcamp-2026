// BONUS — query parametreleriyle filtreleme ve arama
// Çalıştırmak için: npm run test:bonus
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { get, patch, makeTodo, stop } from "../tests/helper.js";

after(stop);

test("GET /todos?completed=true|false → duruma göre filtreler", async () => {
  const biten = await makeTodo({ title: "biten iş", description: "x" });
  await patch(`/todos/${biten.body.id}`, { completed: true });
  await makeTodo({ title: "devam eden iş", description: "x" });

  const tamamlananlar = await get("/todos?completed=true");
  assert.equal(tamamlananlar.status, 200);
  assert.ok(Array.isArray(tamamlananlar.body));
  assert.ok(
    tamamlananlar.body.length > 0,
    "En az bir tamamlanmış todo dönmeli.",
  );
  assert.ok(
    tamamlananlar.body.every((t) => t.completed === true),
    "completed=true yalnızca tamamlanmışları döndürmeli.",
  );

  const bekleyenler = await get("/todos?completed=false");
  assert.equal(bekleyenler.status, 200);
  assert.ok(
    bekleyenler.body.every((t) => t.completed === false),
    "completed=false yalnızca tamamlanmamışları döndürmeli.",
  );
});

test("GET /todos?q=... → title ve description içinde arar", async () => {
  await makeTodo({ title: "Market alışverişi", description: "süt ve ekmek" });
  await makeTodo({ title: "Spor salonu", description: "bacak günü" });

  const baslikta = await get("/todos?q=market");
  assert.equal(baslikta.status, 200);
  assert.ok(
    baslikta.body.some((t) => t.title === "Market alışverişi"),
    "Arama büyük/küçük harfe duyarsız olmalı ('market' → 'Market alışverişi').",
  );
  assert.ok(
    baslikta.body.every(
      (t) =>
        t.title.toLowerCase().includes("market") ||
        t.description.toLowerCase().includes("market"),
    ),
    "Eşleşmeyen kayıtlar dönmemeli.",
  );

  const aciklamada = await get("/todos?q=ekmek");
  assert.ok(
    aciklamada.body.some((t) => t.title === "Market alışverişi"),
    "Arama description içinde de eşleşmeli.",
  );
});

test("GET /todos?completed=true&q=... → iki filtre birlikte çalışır", async () => {
  const hedef = await makeTodo({
    title: "Rapor yaz",
    description: "haftalık rapor",
  });
  await patch(`/todos/${hedef.body.id}`, { completed: true });
  await makeTodo({ title: "Rapor oku", description: "haftalık rapor" });

  const res = await get("/todos?completed=true&q=rapor");
  assert.equal(res.status, 200);
  assert.ok(
    res.body.every((t) => t.completed === true),
    "İki filtre birlikte uygulanmalı.",
  );
  assert.ok(
    res.body.some((t) => t.title === "Rapor yaz"),
    "Her iki koşulu da sağlayan kayıt dönmeli.",
  );
});

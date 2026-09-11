# Week-3 — Veritabanı, ORM ve migration

3. dersin canlı kodu. Hafta 2'nin bellekteki dizi üzerinde çalışan API'si,
PostgreSQL'e taşınmış hâli.

## Çalıştırma

```bash
npm install
cp .env.example .env      # DATABASE_URL'i kendi Neon bağlantınızla doldurun
npx prisma migrate deploy
npm run dev
```

```bash
npm test          # 24 test
npm run test:bonus # 3 filtreleme testi
```

## Yapı

```
prisma/schema.prisma      veri modeli — tabloların tek tanımı
prisma/migrations/        şema değişikliklerinin geçmişi
prisma.config.js          Prisma CLI'nin yapılandırması (kod bunu import etmez)
db/prisma.js              PrismaClient + pg adaptörü
db/pool.js                ham SQL bölümünde kullandığımız pg havuzu
modules/<ad>/
  <ad>.router.js          yolları controller'lara bağlar
  <ad>.validator.js       gövde doğrulaması
  <ad>.controller.js      HTTP ile konuşur
  <ad>.service.js         iş mantığı
  <ad>.db.js              veritabanıyla konuşan TEK katman
  <ad>.db.raw.js          aynı katmanın ham SQL hâli — karşılaştırma için
utils/                    hata yakalayıcılar + Zod yardımcıları
```

## Derste değinilen iki nokta

**Veritabanına iki ayrı yol var.** `npx prisma migrate` komutu adresi
`prisma.config.js`'ten alır; uygulama ise `db/prisma.js` içindeki adaptörden.
İkisi birbirinden habersizdir.

**`todos.db.raw.js` ve `users.db.raw.js` kullanılmıyor.** Aynı işi ham SQL ile
yapan sürümler; Prisma'nın ne yaptığını görebilmek için duruyorlar.

## Henüz yapılmayanlar

`utils/validate.js` ve `utils/AppError.js` hazır ama modüller henüz onları
kullanmıyor. Zod ile doğrulama ve hata yönetimi ayrı bir dersin konusu.

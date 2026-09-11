import { defineConfig } from "prisma/config";

// Uygulamayı biz "node --env-file" ile başlatıyoruz.
// Ama "npx prisma" komutunu Prisma kendi süreci olarak başlatır —
// ona bayrak geçiremeyiz. O yüzden .env'i config dosyası kendi okur.
process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});

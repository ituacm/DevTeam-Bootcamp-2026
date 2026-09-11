# Ödev 4 — Kimlik Doğrulama (Auth), JWT ve Güvenlik

> İTÜ ACM DevTeam Bootcamp 2026 · Ders 4: Kimlik Doğrulama, Şifreleme ve JWT
>
> 🔑 **Referans Kod:** Dersin tamamlanmış kodları için [`Week-4/`](../Week-4) klasörünü inceleyebilirsiniz.
>
> 🎯 **Başlangıç Noktanız:** Kendi Ödev 3 çözümünüz (Prisma, PostgreSQL, Profile ve Tags ilişkileri).

Hafta 3'te veritabanına taşıdığınız ve ilişkilerini kurduğunuz Todo API'ye bu hafta gerçek bir **güvenlik ve yetkilendirme katmanı** ekliyoruz.

Şu ana kadar API'mize herkes serbestçe istek atabiliyor, veritabanına şifreler düz metin yazılıyor ve herkes başkasının todo'sunu değiştirebiliyordu. Bu ödevle birlikte:
1. Şifreler veritabanında asla düz metin saklanmayacak (**`bcrypt`** ile hash'lenecek).
2. Kullanıcılar sisteme kaydolup giriş yaptıklarında **JWT (JSON Web Token)** alacaklar.
3. Rotalar **`verifyAccessToken`** middleware'i ile korunacak; token göndermeyen istekler `401 Unauthorized` ile reddedilecek.
4. **Veri İzolasyonu (Data Ownership)** sağlanacak: Her kullanıcı sadece *kendi* oluşturduğu todo'ları görebilecek, güncelleyebilecek ve silebilecek.

---

## Ne Ekleniyor?

| Metod | Yol | Yetki | Ne yapar |
|---|---|---|---|
| `POST` | `/users/register` | Herkese Açık | Yeni kullanıcı kaydeder, şifreyi hash'ler, token çifti döner |
| `POST` | `/users/login` | Herkese Açık | E-posta ve şifreyi doğrular, token çifti döner |
| `POST` | `/users/refresh` | Herkese Açık | Refresh token ile yeni access token üretir |
| `GET` | `/todos` | **Bearer Token** | Sadece giriş yapan kullanıcının kendi todo'larını listeler |
| `POST` | `/todos` | **Bearer Token** | Giriş yapan kullanıcının adına yeni todo ekler |
| `PUT/PATCH`| `/todos/:id` | **Bearer Token** | Sadece todo'nun asıl sahibi güncelleyebilir (başkası denerse 403/404) |
| `DELETE` | `/todos/:id` | **Bearer Token** | Sadece todo'nun asıl sahibi silebilir (başkası denerse 403/404) |

---

# Bölüm 1 · Başlamadan

## 1.1 Güncellemeleri çekin

```bash
git fetch upstream
git merge upstream/master
npm install
```

Bu işlem `package.json`'a 3 yeni bağımlılık getirir:
* **`bcrypt`**: Şifreleri tek yönlü matematiksel özet fonksiyonuyla (hash) saklamak ve doğrulamak için.
* **`jsonwebtoken`**: İmzalı JWT (Access & Refresh) token'ları üretmek ve doğrulamak için.
* **`cookie-parser`**: İleride cookie tabanlı auth senaryoları için.

## 1.2 Ortam Değişkenleri (.env ve .env.test)

Kayıt, giriş ve token işlemleri gizli anahtarlara (secret key) ihtiyaç duyar. Hem `.env` hem de `.env.test` dosyalarınıza şu satırları ekleyin:

```env
PASSWORD_SECRET_KEY="32HaneliRastgelePasswordSecret"
JWT_ACCESS_SECRET="32HaneliRastgeleAccessSecret"
JWT_REFRESH_SECRET="32HaneliRastgeleRefreshSecret"
ROOT_ADMIN_USERNAME="admin"
```

> **İpucu:** Testler çalışırken ortam değişkenleri tanımlı olmasa bile `tests/helper.js` varsayılan test anahtarları tanımlar; ancak `npm run dev` ile denerken bu değişkenlerin `.env` dosyanızda olması şarttır.

---

# Bölüm 2 · Temel Kavramlar

## 2.1 Hashing vs Şifreleme (Encryption)

* **Şifreleme (İki yönlü):** Bir anahtarla kilitlenir, aynı veya eşlenik anahtarla geri açılabilir (`Metin ➔ Şifreli ➔ Metin`).
* **Hashleme (Tek yönlü):** Girdi ne olursa olsun sabit uzunlukta bir parmak izi üretilir (`Metin ➔ Hash`). Hash'ten geriye orijinal metin **asla dönüştürülemez**.
* Biz kullanıcının şifresini **bilmek istemeyiz**; sadece doğru girip girmediğini test etmek isteriz. Bu yüzden `bcrypt.hash()` ile kaydeder, `bcrypt.compare()` ile doğrularız.

## 2.2 Access Token vs Refresh Token

| Özellik | Access Token | Refresh Token |
|---|---|---|
| **Ömür** | Kısa (örn. 15 dakika) | Uzun (örn. 7 gün) |
| **Kullanım Yeri** | Her API isteğinin `Authorization` başlığında | Yalnızca `/users/refresh` isteğinde |
| **Amaç** | API rotalarına yetkili erişim sağlamak | Kullanıcıyı tekrar login yapmaya zorlamadan yeni access token almak |
| **Güvenlik** | Çalınırsa etkisi 15 dakika sonra biter | Veritabanında geçersiz kılınabilir (revoke) |

## 2.3 Bearer Token Şeması

İstemci korumalı bir rotaya istek atarken token'ı HTTP başlığına (header) şöyle koyar:

```http
GET /todos HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Middleware'iniz bu başlığı okumalı, `Bearer ` kısmını ayıklamalı ve token'ı doğrulamalıdır.

---

# Bölüm 3 · Aşamalar

Tavsiye edilen dosya ve modül yapısı:

```
project/
├── middleware/
│   └── authMiddleware.js     ← verifyAccessToken & requireAdmin
├── modules/
│   ├── todos/
│   │   ├── todos.router.js   ← verifyAccessToken zincirlenir
│   │   └── ...
│   └── users/
│       ├── users.router.js   ← /register, /login, /refresh
│       ├── users.service.js  ← bcrypt & token çağrıları
│       └── ...
└── utils/
    └── token.js              ← generateTokens, verifyRefreshToken
```

---

## Aşama 1 · Token Yardımcıları (`utils/token.js`)

`utils/token.js` dosyasını oluşturun:
1. **`generateAccessToken(user)`**: `user.id`, `user.username`, `user.email` bilgilerini `process.env.JWT_ACCESS_SECRET` ile 15 dakikalık (`expiresIn: "15m"`) imzalar.
2. **`generateRefreshToken(user)`**: `user.id` bilgisini `process.env.JWT_REFRESH_SECRET` ile 7 günlük (`expiresIn: "7d"`) imzalar.
3. **`generateTokens(user)`**: İki token'ı bir nesne olarak döner: `{ accessToken, refreshToken }`.
4. **`verifyRefreshToken(token)`**: Gelen token'ı `jwt.verify(token, process.env.JWT_REFRESH_SECRET)` ile çözer, hata alırsa `null` döner.

---

## Aşama 2 · Kayıt ve Giriş (`POST /users/register` & `/login`)

### `registerUser(username, email, password)`
1. Şifreyi `bcrypt.hash(password + secretKey, 10)` ile hashleyin.
2. Kullanıcıyı veritabanına ekleyin.
3. `generateTokens(user)` ile token çiftini üretin.
4. `{ tokens, user: publicUser(user) }` formatında geri dönün (`201 Created`).
5. **Kritik Kural:** Dönen `user` nesnesinde ve HTTP yanıtında `password` alanı **kesinlikle yer almamalıdır**.

### `loginUser(email, password)`
1. Veritabanından e-postaya göre kullanıcıyı bulun (yoksa `null` dönün).
2. `bcrypt.compare(password + secretKey, user.password)` ile şifreyi kontrol edin. Eşleşmiyorsa `null` dönün.
3. Eşleşirse token çiftini üretip `{ tokens, user: publicUser(user) }` dönün (`200 OK`). Controller'da kullanıcı bulunamazsa `401 Unauthorized` dönün.

---

## Aşama 3 · Token Yenileme (`POST /users/refresh`)

1. İstek gövdesinden `req.body.token` alınır.
2. `verifyRefreshToken(token)` ile kontrol edilir. Geçersizse `401` dönülür.
3. Token içindeki kullanıcı id'siyle kullanıcı veritabanından çekilir.
4. Yeni token çifti üretilip istemciye teslim edilir (`200 OK`).

---

> [!IMPORTANT]
> ### 🚨 Buradan Sonrası: Derste Anlatırken Yetişmeyen ve Sizin Akıl Yürüterek Anlamanızı İstediğim Kısımlar
> 
> Buraya kadarki bölümleri (Token üretimi, Bcrypt ile şifreleme, register, login ve refresh akışları) 4. hafta dersimizde birlikte canlı olarak işledik.
> 
> **Aşağıdaki Aşama 4 ve Aşama 5**, canlı ders süremizin yetmediği; ders referans kodunu ([`Week-4/`](../Week-4)) dikkatlice inceleyerek, dokümantasyonları okuyarak ve **kendi akıl yürütmenizle anlamanızı ve projenize uygulamanızı istediğim** bölümdür.

---

## Aşama 4 · Kimlik Doğrulama Middleware'i (`middleware/authMiddleware.js`)

`verifyAccessToken(req, res, next)` fonksiyonunu yazın:
1. `req.headers.authorization` başlığını kontrol edin.
2. Başlık yoksa veya `Bearer ` ile başlamıyorsa `401 Unauthorized` (`{ message: "Yetkilendirme başlığı eksik." }`) dönün.
3. `authHeader.split(" ")[1]` ile token'ı alın.
4. `jwt.verify(token, process.env.JWT_ACCESS_SECRET)` ile doğrulayın.
5. Hata çıkarsa (süresi dolmuş, bozuk, sahte) `401 Unauthorized` dönün.
6. Başarılıysa çözülen veriyi `req.user = { id: decoded.id, username: decoded.username, email: decoded.email }` olarak ekleyin ve `next()` çağırın.

---

## Aşama 5 · Rotaların Korunması ve Veri İzolasyonu (Data Ownership)

`modules/todos/todos.router.js` içindeki rotaların önüne `verifyAccessToken` middleware'ini ekleyin:

```js
r.get("/", verifyAccessToken, getTodosController);
r.post("/", verifyAccessToken, validateAddTodo, addTodoController);
r.get("/:id", verifyAccessToken, getTodoByIdController);
r.put("/:id", verifyAccessToken, validateReplaceTodo, replaceTodoController);
r.patch("/:id", verifyAccessToken, validateUpdateTodo, updateTodoController);
r.delete("/:id", verifyAccessToken, deleteTodoController);
```

### Veri Sahipliği Kuralları:
1. **`POST /todos`**: Artık `userId` parametresi `req.body`'den alınmaz! `req.user.id`'den otomatik alınarak todo kaydedilir.
2. **`GET /todos`**: Artık tüm todo'lar değil; sadece o an giriş yapmış olan kullanıcının (`where: { userId: req.user.id }`) todo'ları listelenir.
3. **`PUT / PATCH / DELETE /todos/:id`**: İşlem yapılmadan önce todo'nun veritabanında var olup olmadığı ve sahibinin `req.user.id` olup olmadığı denetlenir. Başkasına ait bir todo'yu değiştirmeye veya silmeye çalışan istekler `403 Forbidden` veya `404 Not Found` almalıdır.

---

# Bölüm 4 · Testleri Çalıştırma

Ödevinizi kontrol etmek için:

```bash
npm test
```

Bu komut önceki 7 test dosyasının yanında **`tests/08-auth.test.js`** dosyasındaki 14 yeni güvenlik testini de çalıştırır.

Test çıktısında kırmızı bir hata görürseniz, testin verdiği `AssertionError` mesajını dikkatlice okuyun; her hata neyin eksik olduğunu açıkça belirtir.

Başarılar! 🚀

// ⚠️ Bu dosyaya dokunmanıza gerek yok.
//
// Uygulamayı ayağa kaldıran tek yer burası. app.js ise yalnızca Express
// uygulamasını kurup dışarı verir — çünkü testler onu kendi portlarında
// çalıştırabilmek için import ediyor.

import server from "./app.js";

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

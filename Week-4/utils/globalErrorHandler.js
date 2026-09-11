// Hata yanıtını yazan tek yer.
const globalErrorHandler = (err, req, res, next) => {
  // Tamamını log'la: Prisma hatalarında code ve meta burada görünür.
  console.error(err);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    // Zod doğrulaması birden çok hatayı birlikte döndürür.
    ...(err.details && { details: err.details }),
  });
};

export default globalErrorHandler;

import { badRequest } from "./AppError.js";

// Şema alır, middleware döndürür. Yanıt yazmaz — hata fırlatır.
export const validate = (schemas) => (req, res, next) => {
  for (const source of ["params", "body", "query"]) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = schema.safeParse(req[source]);

    if (!result.success) {
      throw badRequest(
        "Validation failed",
        result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    // DİKKAT: Express 5'te req.query salt okunurdur.
    if (source === "body") req.body = result.data;
  }

  next();
};

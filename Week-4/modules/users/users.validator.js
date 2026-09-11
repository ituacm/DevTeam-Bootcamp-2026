import { z } from "zod";

// Schemas
const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required").max(32,"Password is too long"),
  //max 32 dedik çünkü: 32 karakter password + 32 karakter secret, kullandığımız şifreleme metodunun 64 karakterlik sınırını aşıyor
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required").max(32,"Password is too long"),
  //max 32 dedik çünkü: 32 karakter password + 32 karakter secret, kullandığımız şifreleme metodunun 64 karakterlik sınırını aşıyor
});

// Middleware functions
export const validateRegisterUser = (req, res, next) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  next();
};

export const validateLoginUser = (req, res, next) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  next();
};

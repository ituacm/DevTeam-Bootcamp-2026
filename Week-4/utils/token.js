import jwt from "jsonwebtoken";

/**
 * Kullanıcı için kısa ömürlü Access Token üretir (15 dakika)
 * authMiddleware'in beklediği id, username, email bilgilerini içerir.
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

/**
 * Kullanıcı için uzun ömürlü Refresh Token üretir (7 gün)
 * Login için
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Hem Access hem Refresh token'ı tek seferde üretir
 * Register için
 */
export const generateTokens = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

/**
 * Gelen Refresh Token'ı doğrular 
 * "/refresh" endpoint'i için
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

import jwt from "jsonwebtoken";


/**
 * Middleware: Verify access token from Authorization header
 * Sets req.user = { id, username, email, role }
 */
export const verifyAccessToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Yetkilendirme başlığı eksik." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.username == process.env.ROOT_ADMIN_USERNAME ? "admin" : "user", // şuan root admin kullanıyoruz sadece ama ileride RBAC temelli dinamik role ataması için decoded.role kullanılır.
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Geçersiz veya süresi dolmuş token." });
    }
};

/**
 * Middleware: Require admin role
 * Must be used after verifyAccessToken
 */
export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
    }
    next();
};
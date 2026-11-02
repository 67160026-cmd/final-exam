// middlewares/auth.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // รับ Token จาก Header รูปแบบ: Bearer <TOKEN>
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const secret = process.env.JWT_SECRET || "your_jwt_secret_key";
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // เก็บข้อมูล user ไว้ใช้ใน controller/route
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authenticateToken;

require("dotenv").config();
const db = require("./db");
const startServer = require("./server");

async function bootstrap() {
  try {
    // 1. ตรวจสอบการเชื่อมต่อฐานข้อมูลก่อนเริ่ม Server
    await db.getConnection();
    console.log("✅ Connected to database successfully.");

    // 2. สั่งให้ Server ทำงาน
    const PORT = process.env.PORT || 3000;
    startServer(PORT);
  } catch (error) {
    console.error("❌ Failed to start application:", error.message);
    process.exit(1);
  }
}

bootstrap();

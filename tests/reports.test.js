const request = require("supertest");
const app = require("../app");
const db = require("../db");

describe("Reports & System Error Endpoints", () => {
  // 1. ทดสอบรายงานสรุปยอดขาย (Aggregation Query)
  it("GET /api/reports/sales - ควรดึงรายงานยอดขายสรุปได้ถูกต้อง", async () => {
    const res = await request(app).get("/api/reports/sales");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty("menu_item_id");
      expect(res.body.data[0]).toHaveProperty("total_revenue");
    }
  });

  // 2. ทดสอบการดักจับ 404 Not Found
  it("GET /api/unknown-route - ควรคืนค่า 404 เมื่อเรียก Path ที่ไม่มีจริง", async () => {
    const res = await request(app).get("/api/unknown-route");

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });

  // ปิดการเชื่อมต่อ Database Pool หลังรันเคสทดสอบทั้งหมดเสร็จ
  afterAll(async () => {
    await db.end();
  });
});

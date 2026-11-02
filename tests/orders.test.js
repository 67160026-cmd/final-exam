const request = require("supertest");
const app = require("../app");
const db = require("../db");

describe("Order Endpoints (/api/orders)", () => {
  let createdOrderId;

  // 1. ทดสอบสร้างคำสั่งซื้อสำเร็จ (Transaction Logic)
  it("POST /api/orders - ควรสร้างคำสั่งซื้อพร้อมคำนวณราคารวมได้ถูกต้อง", async () => {
    const orderPayload = {
      customer_name: "ทดสอบการสั่งซื้อ",
      items: [
        { menu_item_id: 1, quantity: 2 },
        { menu_item_id: 2, quantity: 1 },
      ],
    };

    const res = await request(app).post("/api/orders").send(orderPayload);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("order_id");
    expect(res.body.data.customer_name).toBe("ทดสอบการสั่งซื้อ");

    createdOrderId = res.body.data.order_id;
  });

  // 2. ทดสอบกรณีส่งข้อมูลการสั่งซื้อไม่ถูกต้อง (Validation Fail)
  it("POST /api/orders - ควรปฏิเสธเมื่อไม่มีรายการสินค้า (items)", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ customer_name: "สมชาย", items: [] });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  // 3. ทดสอบการดึงประวัติคำสั่งซื้อทั้งหมด (GET)
  it("GET /api/orders - ควรดึงประวัติคำสั่งซื้อพร้อมรายการย่อยได้สำเร็จ", async () => {
    const res = await request(app).get("/api/orders");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 4. ทดสอบการอัปเดตสถานะออเดอร์ (PUT)
  it("PUT /api/orders/:id/status - ควรอัปเดตสถานะเป็น delivered ได้", async () => {
    const res = await request(app)
      .put(`/api/orders/${createdOrderId}/status`)
      .send({ status: "delivered" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  // 5. ทดสอบอัปเดตสถานะออเดอร์ที่ไม่มีอยู่จริง (404)
  it("PUT /api/orders/:id/status - ควรคืนค่า 404 เมื่อไม่พบ Order ID", async () => {
    const res = await request(app)
      .put("/api/orders/999999/status")
      .send({ status: "cancelled" });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });

  // ปิดการเชื่อมต่อ Database Pool หลังรันเคสทดสอบทั้งหมดเสร็จ
  afterAll(async () => {
    await db.end();
  });
});

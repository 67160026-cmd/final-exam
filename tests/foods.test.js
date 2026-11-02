const request = require("supertest");
const app = require("../app");
const db = require("../db");

describe("Food Endpoints (/api/foods)", () => {
  let createdFoodId;

  // 1. ทดสอบการดึงรายการอาหารทั้งหมด
  it("GET /api/foods - ควรดึงรายการอาหารทั้งหมดได้สำเร็จ", async () => {
    const res = await request(app).get("/api/foods");
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 2. ทดสอบการค้นหาและกรองราคา
  it("GET /api/foods - ค้นหาแบบกรองช่วงราคาและชื่อ", async () => {
    const res = await request(app)
      .get("/api/foods")
      .query({ search: "กะเพรา", maxPrice: 100, available: "true" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  // 3. ทดสอบการเพิ่มเมนูอาหารใหม่ (POST)
  it("POST /api/foods - ควรสร้างเมนูอาหารใหม่ได้สำเร็จ", async () => {
    const newFood = {
      name: "ข้าวผัดต้มยำกุ้ง (Test)",
      price: 85.0,
      available: true,
    };

    const res = await request(app).post("/api/foods").send(newFood);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");

    createdFoodId = res.body.data.id; // เก็บ ID ไว้ทดสอบ PUT/DELETE
  });

  // 4. ทดสอบกรณีส่งข้อมูลไม่ครบ
  it("POST /api/foods - ควรปฏิเสธเมื่อไม่ระบุชื่ออาหารหรือราคา", async () => {
    const res = await request(app).post("/api/foods").send({ price: 50.0 }); // ขาด name

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  // 5. ทดสอบการอัปเดตเมนูอาหาร (PUT)
  it("PUT /api/foods/:id - คควรอัปเดตสถานะพร้อมขายเป็น false ได้", async () => {
    const res = await request(app)
      .put(`/api/foods/${createdFoodId}`)
      .send({ available: false, price: 90.0 });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  // 6. ทดสอบการลบเมนูอาหาร (DELETE)
  it("DELETE /api/foods/:id - ควรลบเมนูอาหารได้สำเร็จ", async () => {
    const res = await request(app).delete(`/api/foods/${createdFoodId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  // ปิดการเชื่อมต่อ Database Pool หลังรันเคสทดสอบทั้งหมดเสร็จ
  afterAll(async () => {
    await db.end();
  });
});

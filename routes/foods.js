const express = require("express");
const router = express.Router();
const db = require("../db"); // ไฟล์เชื่อมต่อ MySQL (mysql2/promise)

// 1. GET /api/foods - ดึงรายการอาหารทั้งหมด + ตัวกรอง
router.get("/", async (req, res, next) => {
  try {
    const { search, minPrice, maxPrice, available } = req.query;
    let sql = "SELECT * FROM menu_items WHERE 1=1";
    let params = [];

    if (search) {
      sql += " AND name LIKE ?";
      params.push(`%${search}%`);
    }
    if (minPrice) {
      sql += " AND price >= ?";
      params.push(minPrice);
    }
    if (maxPrice) {
      sql += " AND price <= ?";
      params.push(maxPrice);
    }
    if (available !== undefined && available !== "") {
      sql += " AND available = ?";
      params.push(available === "true" ? 1 : 0);
    }

    sql += " ORDER BY id DESC";
    const [foods] = await db.query(sql, params);

    res.json({ success: true, data: foods });
  } catch (error) {
    next(error);
  }
});

// 2. POST /api/foods - เพิ่มเมนูอาหารใหม่
router.post("/", async (req, res, next) => {
  try {
    const { name, price, available = true } = req.body;

    if (!name || price === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "กรุณาระบุชื่อเมนูและราคาอาหาร" });
    }

    const [result] = await db.query(
      "INSERT INTO menu_items (name, price, available) VALUES (?, ?, ?)",
      [name, price, available ? 1 : 0],
    );

    res.status(201).json({
      success: true,
      message: "เพิ่มเมนูอาหารสำเร็จ",
      data: { id: result.insertId, name, price, available: Boolean(available) },
    });
  } catch (error) {
    next(error);
  }
});

// 3. PUT /api/foods/:id - อัปเดตข้อมูล/สถานะเมนูอาหาร
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, available } = req.body;

    let fields = [];
    let params = [];

    if (name !== undefined) {
      fields.push("name = ?");
      params.push(name);
    }
    if (price !== undefined) {
      fields.push("price = ?");
      params.push(price);
    }
    if (available !== undefined) {
      fields.push("available = ?");
      params.push(available ? 1 : 0);
    }

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "ไม่มีข้อมูลแก้ไข" });
    }

    params.push(id);
    await db.query(
      `UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`,
      params,
    );

    res.json({ success: true, message: "อัปเดตเมนูอาหารสำเร็จ" });
  } catch (error) {
    next(error);
  }
});

// 4. DELETE /api/foods/:id - ลบเมนูอาหาร
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM menu_items WHERE id = ?", [id]);
    res.json({ success: true, message: "ลบเมนูอาหารสำเร็จ" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

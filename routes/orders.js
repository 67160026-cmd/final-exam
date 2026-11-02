const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /api/orders - บันทึกคำสั่งซื้อใหม่
router.post("/", async (req, res, next) => {
  const { customer_name, items } = req.body;

  if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "ข้อมูลการสั่งซื้อไม่ถูกต้อง",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. สร้าง Record ในตาราง orders
    const [orderResult] = await connection.query(
      "INSERT INTO orders (customer_name, status) VALUES (?, ?)",
      [customer_name, "pending"],
    );

    const orderId = orderResult.insertId;
    let totalPrice = 0;
    const itemDetails = [];

    // 2. ตรวจสอบสินค้าและบันทึกลงตาราง order_items
    for (const item of items) {
      const menuItemId = item.menu_item_id || item.food_id;
      const quantity = item.quantity;

      const [menuRows] = await connection.query(
        "SELECT id, name, price, available FROM menu_items WHERE id = ? FOR UPDATE",
        [menuItemId],
      );

      if (menuRows.length === 0) {
        throw new Error(`ไม่พบรายการอาหารรหัส ${menuItemId}`);
      }

      const menuItem = menuRows[0];

      if (!menuItem.available) {
        throw new Error(`รายการอาหาร ${menuItem.name} ไม่พร้อมจำหน่าย`);
      }

      totalPrice += Number(menuItem.price) * quantity;

      await connection.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES (?, ?, ?)",
        [orderId, menuItemId, quantity],
      );

      itemDetails.push({
        menu_item_id: menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
      });
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "สร้างคำสั่งซื้อสำเร็จ",
      data: {
        order_id: orderId,
        customer_name,
        status: "pending",
        total_price: totalPrice,
        items: itemDetails,
      },
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    connection.release();
  }
});

// GET /api/orders - ดึงประวัติคำสั่งซื้อทั้งหมดพร้อมรายการสินค้าย่อย
router.get("/", async (req, res, next) => {
  try {
    // 1. ดึงรายการคำสั่งซื้อหลัก
    const [orders] = await db.query(`
            SELECT o.id AS order_id, o.customer_name, o.status, o.created_at,
                   COALESCE(SUM(oi.quantity * mi.price), 0.00) AS total_price
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
            GROUP BY o.id, o.customer_name, o.status, o.created_at
            ORDER BY o.id DESC
        `);

    // 2. ดึงรายการสินค้าย่อยในแต่ละออเดอร์
    const [items] = await db.query(`
            SELECT oi.order_id, oi.quantity, mi.id AS menu_item_id, mi.name, mi.price
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
        `);

    // 3. รวมข้อมูลสินค้าย่อยเข้ากับออเดอร์หลัก
    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: items.filter((item) => item.order_id === order.order_id),
    }));

    res.status(200).json({
      success: true,
      data: ordersWithItems,
    });
  } catch (error) {
    next(error);
  }
});
// PUT /api/orders/:id/status - อัปเดตสถานะ (pending, preparing, delivered, cancelled)
router.put("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [result] = await db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบคำสั่งซื้อที่ต้องการอัปเดต",
      });
    }

    res.status(200).json({
      success: true,
      message: `อัปเดตสถานะคำสั่งซื้อหมายเลข ${id} เป็น ${status} สำเร็จ`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/reports/sales - รายงานยอดขายรวม
router.get("/sales", async (req, res, next) => {
  try {
    const sql = `
            SELECT 
                mi.id AS menu_item_id,
                mi.name AS menu_name,
                mi.price,
                COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
                COALESCE(SUM(oi.quantity * mi.price), 0.00) AS total_revenue
            FROM menu_items mi
            LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
            LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('delivered', 'completed')
            GROUP BY mi.id, mi.name, mi.price
            ORDER BY total_revenue DESC;
        `;

    const [rows] = await db.query(sql);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

// middlewares/validateOrder.js
const validateOrderInput = (req, res, next) => {
  const { customer_name, items } = req.body;

  if (
    !customer_name ||
    typeof customer_name !== "string" ||
    customer_name.trim() === ""
  ) {
    return res.status(400).json({
      success: false,
      message: "กรุณาระบุชื่อผู้สั่งซื้อ (customer_name)",
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "กรุณาเลือกรายการสินค้าอย่างน้อย 1 รายการ (items)",
    });
  }

  for (const item of items) {
    if (!item.food_id || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "รายการสินค้าต้องประกอบด้วย food_id และ quantity ที่มากกว่า 0",
      });
    }
  }

  next();
};

module.exports = validateOrderInput;

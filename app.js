const express = require("express");
const cors = require("cors");

// 1. นำเข้า Routes
const foodRoutes = require("./routes/foods");
const orderRoutes = require("./routes/orders");
const reportRoutes = require("./routes/reports");
const testRoutes = require("./routes/health");

const app = express();

// 2. Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// 4. Register Routes
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/test", testRoutes);

// 5. 404 Handler (ดักจับ Endpoint ที่ไม่มีอยู่จริง)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`,
  });
});

// 6. Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;

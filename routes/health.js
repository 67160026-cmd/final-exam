const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/test/health
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    message: "Server is running normally",
    timestamp: new Date().toISOString(),
  });
});

// GET /api/test/db
router.get("/db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS currentTime");
    res.status(200).json({
      success: true,
      message: "Database connection successful",
      serverTime: rows[0].currentTime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// POST /api/test/echo
router.post("/echo", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Data received successfully",
    receivedQuery: req.query,
    receivedBody: req.body,
  });
});

module.exports = router;

// connection pool ของ MySQL
// const mysql = require("mysql2/promise");
// const { db } = require("./config");

// const pool = mysql.createPool({
//   host: db.host,
//   port: db.port,
//   user: db.user,
//   password: db.password,
//   database: db.database,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// module.exports = { pool };

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "food_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;

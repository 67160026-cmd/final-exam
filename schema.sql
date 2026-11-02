CREATE DATABASE IF NOT EXISTS food_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE food_db;

-- ตารางรายการอาหาร
CREATE TABLE IF NOT EXISTS foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    is_available TINYINT(1) DEFAULT 1
);

-- ตารางคำสั่งซื้อ
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางรายละเอียดสินค้าในคำสั่งซื้อ
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id)
);

-- ข้อมูลตัวอย่างสำหรับทดสอบ
INSERT INTO foods (name, category, price, stock, is_available) VALUES
('ข้าวมันไก่', 'Main', 50.00, 20, 1),
('ข้าวผัดกะเพราหมูสับ', 'Main', 55.00, 15, 1),
('ชาไทยเย็น', 'Beverage', 30.00, 50, 1),
('บัวลอยนมสด', 'Dessert', 35.00, 10, 1);
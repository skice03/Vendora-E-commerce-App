-- ============================================================
-- Vendora Database Cleanup Script
-- Removes ALL test data while keeping:
--   * Admin user (ID=1, marinelcipu21@gmail.com)
--   * All seeded categories
--   * Product definitions (kept by default)
-- ============================================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Remove all audit logs
DELETE FROM AuditLogs;

-- 2. Remove all order items and orders
DELETE FROM OrderItems;
DELETE FROM Orders;

-- 3. Remove all reviews
DELETE FROM Reviews;

-- 4. Remove all wishlist items
DELETE FROM WishlistItems;

-- 5. Remove all user addresses
DELETE FROM Addresses;

-- 6. Remove all users EXCEPT the admin (ID=1)
DELETE FROM Users WHERE Id != 1;

-- 7. Reset product view counts to 0
UPDATE Products SET ViewCount = 0;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment counters
ALTER TABLE Orders AUTO_INCREMENT = 1;
ALTER TABLE OrderItems AUTO_INCREMENT = 1;
ALTER TABLE Reviews AUTO_INCREMENT = 1;
ALTER TABLE WishlistItems AUTO_INCREMENT = 1;
ALTER TABLE AuditLogs AUTO_INCREMENT = 1;
ALTER TABLE Addresses AUTO_INCREMENT = 1;
ALTER TABLE Users AUTO_INCREMENT = 2;

SELECT 'Cleanup complete. Only admin user and products/categories remain.' AS Result;

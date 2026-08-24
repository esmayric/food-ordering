-- Mevcut yemekdb veritabanını güncel şemaya taşımak için bir kez çalıştırın.
-- Bu dosya tekrar çalıştırılabilecek şekilde mevcut kolonları kontrol eder.

USE yemekdb;

SET @old_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- order_items.unit_price yoksa ekle
SELECT COUNT(*) INTO @has_unit_price
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'order_items'
  AND COLUMN_NAME = 'unit_price';

SET @sql = IF(
  @has_unit_price = 0,
  'ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10,2) NULL AFTER quantity',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eski siparişlerde sipariş anındaki fiyat bilinmediği için yalnızca mevcut fiyatla doldurulur.
-- Yeni siparişlerde gerçek sipariş anındaki fiyat unit_price alanına kaydedilir.
UPDATE order_items oi
JOIN foods f ON oi.food_id = f.id
SET oi.unit_price = f.price
WHERE oi.unit_price IS NULL;

ALTER TABLE order_items
MODIFY unit_price DECIMAL(10,2) NOT NULL;

-- orders.payment_method yoksa ekle
SELECT COUNT(*) INTO @has_payment_method
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'orders'
  AND COLUMN_NAME = 'payment_method';

SET @sql = IF(
  @has_payment_method = 0,
  'ALTER TABLE orders ADD COLUMN payment_method ENUM(''cash'',''card'') NOT NULL DEFAULT ''cash'' AFTER total_price',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET SQL_SAFE_UPDATES = @old_safe_updates;

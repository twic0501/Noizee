-- Xóa database cũ nếu tồn tại và tạo database mới
DROP DATABASE IF EXISTS `salesdb`;
CREATE DATABASE `salesdb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `salesdb`;

-- Bảng categories
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name_vi` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_name_en` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `category_name_vi` (`category_name_vi`),
  UNIQUE KEY `category_name_en` (`category_name_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng colors
CREATE TABLE `colors` (
  `color_id` int NOT NULL AUTO_INCREMENT,
  `color_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_name_en` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL, -- Thêm trường này
  `color_hex` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`color_id`),
  UNIQUE KEY `color_name` (`color_name`),
  UNIQUE KEY `color_name_en` (`color_name_en`), -- Thêm unique key
  UNIQUE KEY `color_hex` (`color_hex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng collections
CREATE TABLE `collections` (
  `collection_id` int NOT NULL AUTO_INCREMENT,
  `collection_name_vi` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `collection_name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection_description_vi` text COLLATE utf8mb4_unicode_ci,
  `collection_description_en` text COLLATE utf8mb4_unicode_ci,
  `slug` varchar(110) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`collection_id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `unique_collection_name_vi` (`collection_name_vi`),
  UNIQUE KEY `unique_collection_name_en` (`collection_name_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng customers
CREATE TABLE `customers` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_tel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL, -- Cho phép NULL ban đầu cho OAuth
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `googleId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `virtual_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `password_reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP, -- Thêm timestamps
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Thêm timestamps
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `customer_email` (`customer_email`),
  UNIQUE KEY `customer_tel` (`customer_tel`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `googleId` (`googleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng products
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `product_name_vi` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_description_vi` text COLLATE utf8mb4_unicode_ci,
  `product_description_en` text COLLATE utf8mb4_unicode_ci,
  `product_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `category_id` int DEFAULT NULL,
  `is_new_arrival` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`product_id`),
  KEY `fk_product_category` (`category_id`),
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng sizes
CREATE TABLE `sizes` (
  `size_id` int NOT NULL AUTO_INCREMENT,
  `size_name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`size_id`),
  UNIQUE KEY `size_name` (`size_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng inventory
CREATE TABLE `inventory` (
  `inventory_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `size_id` int DEFAULT NULL,
  `color_id` int DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `unique_variant` (`product_id`,`size_id`,`color_id`),
  KEY `fk_inventory_size` (`size_id`),
  KEY `fk_inventory_color` (`color_id`),
  CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inventory_size` FOREIGN KEY (`size_id`) REFERENCES `sizes` (`size_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_inventory_color` FOREIGN KEY (`color_id`) REFERENCES `colors` (`color_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_chk_1` CHECK ((`quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng productcollections
CREATE TABLE `productcollections` (
  `product_id` int NOT NULL,
  `collection_id` int NOT NULL,
  PRIMARY KEY (`product_id`,`collection_id`),
  KEY `collection_id` (`collection_id`),
  CONSTRAINT `productcollections_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `productcollections_ibfk_2` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`collection_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng productimages
CREATE TABLE `productimages` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `color_id` int DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_text_vi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alt_text_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`image_id`),
  UNIQUE KEY `unique_display_order` (`product_id`,`color_id`,`display_order`),
  KEY `fk_productimage_color` (`color_id`),
  KEY `idx_product_color_order` (`product_id`,`color_id`,`display_order`),
  CONSTRAINT `fk_productimage_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_productimage_color` FOREIGN KEY (`color_id`) REFERENCES `colors` (`color_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng sales
CREATE TABLE `sales` (
  `sale_id` int NOT NULL AUTO_INCREMENT,
  `sale_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sale_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `customer_id` int DEFAULT NULL,
  `shipping_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_notes` text COLLATE utf8mb4_unicode_ci,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'COD',
  PRIMARY KEY (`sale_id`),
  KEY `fk_sale_customer` (`customer_id`),
  CONSTRAINT `fk_sale_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng saleshistory
CREATE TABLE `saleshistory` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `history_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `history_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `history_notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`history_id`),
  KEY `idx_sale_history` (`sale_id`),
  CONSTRAINT `saleshistory_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng salesitems
CREATE TABLE `salesitems` (
  `sale_item_id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `size_id` int DEFAULT NULL,
  `color_id` int DEFAULT NULL,
  `product_qty` int NOT NULL,
  `price_at_sale` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `product_name_at_sale` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_sku_at_sale` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`sale_item_id`),
  KEY `idx_saleitem_sale` (`sale_id`),
  KEY `idx_saleitem_product` (`product_id`),
  KEY `idx_saleitem_size` (`size_id`),
  KEY `idx_saleitem_color` (`color_id`),
  CONSTRAINT `fk_saleitem_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `salesitems_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `salesitems_ibfk_2` FOREIGN KEY (`size_id`) REFERENCES `sizes` (`size_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `salesitems_ibfk_3` FOREIGN KEY (`color_id`) REFERENCES `colors` (`color_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `salesitems_chk_1` CHECK ((`product_qty` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng salestotals
CREATE TABLE `salestotals` (
  `total_id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `subtotal_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`total_id`),
  UNIQUE KEY `sale_id` (`sale_id`),
  CONSTRAINT `salestotals_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng blogposts
CREATE TABLE `blogposts` (
  `post_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title_vi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `excerpt_vi` text COLLATE utf8mb4_unicode_ci,
  `excerpt_en` text COLLATE utf8mb4_unicode_ci,
  `content_html_vi` longtext COLLATE utf8mb4_unicode_ci,
  `content_html_en` longtext COLLATE utf8mb4_unicode_ci,
  `content_markdown_vi` longtext COLLATE utf8mb4_unicode_ci,
  `content_markdown_en` longtext COLLATE utf8mb4_unicode_ci,
  `featured_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','published','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `visibility` enum('public','private','members_only') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  `allow_comments` tinyint(1) NOT NULL DEFAULT '1',
  `template_key` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_title_vi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description_vi` text COLLATE utf8mb4_unicode_ci,
  `meta_description_en` text COLLATE utf8mb4_unicode_ci,
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_blogpost_slug` (`slug`),
  KEY `idx_blogpost_status` (`status`),
  KEY `idx_blogpost_user_id` (`user_id`),
  KEY `idx_blogpost_published_at` (`published_at`),
  CONSTRAINT `fk_blogpost_user` FOREIGN KEY (`user_id`) REFERENCES `customers` (`customer_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng blogtags
CREATE TABLE `blogtags` (
  `tag_id` int NOT NULL AUTO_INCREMENT,
  `name_vi` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tag_id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `unique_blogtag_name_vi` (`name_vi`),
  UNIQUE KEY `unique_blogtag_name_en` (`name_en`),
  KEY `idx_blogtag_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng blogposttags
CREATE TABLE `blogposttags` (
  `post_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`post_id`,`tag_id`),
  KEY `fk_blogposttags_tag` (`tag_id`),
  CONSTRAINT `fk_blogposttags_post` FOREIGN KEY (`post_id`) REFERENCES `blogposts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_blogposttags_tag` FOREIGN KEY (`tag_id`) REFERENCES `blogtags` (`tag_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng blogcomments
CREATE TABLE `blogcomments` (
  `comment_id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `parent_comment_id` int DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending_approval','approved','spam','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`),
  KEY `fk_blogcomment_parent` (`parent_comment_id`),
  KEY `idx_blogcomment_post_id` (`post_id`),
  KEY `idx_blogcomment_user_id` (`user_id`),
  KEY `idx_blogcomment_status` (`status`),
  CONSTRAINT `fk_blogcomment_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `blogcomments` (`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_blogcomment_post` FOREIGN KEY (`post_id`) REFERENCES `blogposts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_blogcomment_user` FOREIGN KEY (`user_id`) REFERENCES `customers` (`customer_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- CHÈN DỮ LIỆU MẪU --

-- 1. Chèn User Admin
-- Mật khẩu '$2a$10$KWdky.fDi6HH5IogqlBKhuBzv81J9NBxo2IQ4tE8RD3dHfeR3NreW' là hash của 'adminpassword'
INSERT INTO `customers`
(`customer_id`, `customer_name`, `username`, `customer_email`, `customer_tel`, `customer_password`, `isAdmin`, `virtual_balance`, `created_at`, `updated_at`, `googleId`, `password_reset_token`, `password_reset_expires`)
VALUES
(1, 'Admin Full Control', 'admin', 'admin@yourstore.com', '0900000001', '$2a$10$KWdky.fDi6HH5IogqlBKhuBzv81J9NBxo2IQ4tE8RD3dHfeR3NreW', 1, 1000000.00, NOW(), NOW(), NULL, NULL, NULL);

-- Chèn một user thường để test
-- Mật khẩu '$2a$10$V.xXn0mJ0p2zI9rG8Z.aC.c3QkYgGfX7sR9zJ0eX.L9w8qX.oK/Gu' là hash của 'userpassword'
INSERT INTO `customers`
(`customer_id`, `customer_name`, `username`, `customer_email`, `customer_tel`, `customer_password`, `isAdmin`, `virtual_balance`, `created_at`, `updated_at`)
VALUES
(2, 'Khách Hàng A', 'khachhanga', 'khachhang.a@example.com', '0900000002', '$2a$10$V.xXn0mJ0p2zI9rG8Z.aC.c3QkYgGfX7sR9zJ0eX.L9w8qX.oK/Gu', 0, 2000000.00, NOW(), NOW());


-- 2. Chèn Categories (Loại sản phẩm)
INSERT INTO `categories` (`category_name_vi`, `category_name_en`) VALUES
('Áo Sơ Mi', 'Shirts'),
('Quần Jeans', 'Jeans'),
('Váy Đầm', 'Dresses'),
('Áo Thun', 'T-Shirts'),
('Phụ Kiện', 'Accessories');

-- 3. Chèn Colors (Màu sắc)
INSERT INTO `colors` (`color_name`, `color_name_en`, `color_hex`) VALUES
('Đen', 'Black', '#000000'),
('Trắng', 'White', '#FFFFFF'),
('Xanh Navy', 'Navy Blue', '#000080'),
('Đỏ', 'Red', '#FF0000'),
('Xám', 'Gray', '#808080');

-- 4. Chèn Sizes (Kích thước)
INSERT INTO `sizes` (`size_name`) VALUES
('S'), ('M'), ('L'), ('XL'), ('FreeSize');

-- 5. Chèn Collections (Bộ sưu tập)
INSERT INTO `collections` (`collection_name_vi`, `collection_name_en`, `collection_description_vi`, `collection_description_en`, `slug`) VALUES
('Xu Hướng Hè 2025', 'Summer Trends 2025', 'Bộ sưu tập mới nhất cho mùa hè năng động.', 'Latest collection for an active summer.', 'xu-huong-he-2025'),
('Thời Trang Công Sở', 'Office Wear', 'Trang phục thanh lịch cho môi trường công sở.', 'Elegant outfits for the office environment.', 'thoi-trang-cong-so'),
('Đồ Basic Cần Có', 'Essential Basics', 'Những item cơ bản không thể thiếu trong tủ đồ.', 'Must-have basic items in your wardrobe.', 'do-basic-can-co');

-- 6. Chèn Blog Tags (Thẻ Blog)
INSERT INTO `blogtags` (`name_vi`, `name_en`, `slug`, `created_at`, `updated_at`) VALUES
('Thời Trang Nam', 'Men Fashion', 'thoi-trang-nam', NOW(), NOW()),
('Thời Trang Nữ', 'Women Fashion', 'thoi-trang-nu', NOW(), NOW()),
('Mẹo Phối Đồ', 'Styling Tips', 'meo-phoi-do', NOW(), NOW());

-- 7. Chèn Blog Post (Bởi User Admin ID=1)
INSERT INTO `blogposts`
(`user_id`, `title_vi`, `title_en`, `slug`, `excerpt_vi`, `content_html_vi`, `status`, `visibility`, `allow_comments`, `published_at`, `created_at`, `updated_at`)
VALUES
(
    1, -- user_id của Admin
    'Chào Mừng Đến Với Blog Thời Trang Của Chúng Tôi!',
    'Welcome to Our Fashion Blog!',
    'chao-mung-den-voi-blog-thoi-trang',
    'Đây là bài viết đầu tiên trên blog. Hãy cùng khám phá những xu hướng mới nhất.',
    '<p>Nội dung chi tiết của bài viết đầu tiên. Chúng tôi sẽ cập nhật thường xuyên các bài viết về thời trang, mẹo phối đồ và nhiều hơn nữa. Hãy theo dõi nhé!</p>',
    'published',
    'public',
    1,
    NOW(),
    NOW(),
    NOW()
);

-- Liên kết bài viết với thẻ
SET @post_id_1 = (SELECT post_id FROM blogposts WHERE slug = 'chao-mung-den-voi-blog-thoi-trang' LIMIT 1);
SET @tag_id_nam = (SELECT tag_id FROM blogtags WHERE slug = 'thoi-trang-nam' LIMIT 1);
SET @tag_id_nu = (SELECT tag_id FROM blogtags WHERE slug = 'thoi-trang-nu' LIMIT 1);

INSERT INTO `blogposttags` (`post_id`, `tag_id`)
SELECT @post_id_1, @tag_id_nam WHERE @post_id_1 IS NOT NULL AND @tag_id_nam IS NOT NULL;

INSERT INTO `blogposttags` (`post_id`, `tag_id`)
SELECT @post_id_1, @tag_id_nu WHERE @post_id_1 IS NOT NULL AND @tag_id_nu IS NOT NULL;


-- Chèn một sản phẩm mẫu
SET @category_ao_thun_id = (SELECT category_id FROM categories WHERE category_name_vi = 'Áo Thun' LIMIT 1);
SET @color_den_id = (SELECT color_id FROM colors WHERE color_name = 'Đen' LIMIT 1);
SET @size_m_id = (SELECT size_id FROM sizes WHERE size_name = 'M' LIMIT 1);

INSERT INTO `products` (`product_name_vi`, `product_name_en`, `product_description_vi`, `product_price`, `category_id`, `is_new_arrival`, `is_active`) VALUES
('Áo Thun Cotton Đen Basic', 'Basic Black Cotton T-Shirt', 'Áo thun cotton 100% màu đen, form basic dễ phối đồ.', 250000.00, @category_ao_thun_id, 1, 1);
SET @product_id_1 = LAST_INSERT_ID();

INSERT INTO `inventory` (`product_id`, `size_id`, `color_id`, `quantity`, `sku`) VALUES
(@product_id_1, @size_m_id, @color_den_id, 50, CONCAT('AT-DEN-M-', @product_id_1));

INSERT INTO `productimages` (`product_id`, `color_id`, `image_url`, `alt_text_vi`, `display_order`) VALUES
(@product_id_1, @color_den_id, '/uploads/placeholder_product.jpg', 'Áo thun đen basic mặt trước', 0);


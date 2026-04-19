-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1:3306
-- Thời gian đã tạo: Th4 19, 2026 lúc 11:47 AM
-- Phiên bản máy phục vụ: 8.4.7
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `restaurant_order`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Món chính'),
(2, 'Nước uống'),
(3, 'Tráng miệng'),
(5, 'Lẩu');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `table_id` int DEFAULT NULL,
  `status` enum('pending','confirmed','preparing','done','paid') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `total_price` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `table_id` (`table_id`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `table_id`, `status`, `total_price`, `created_at`) VALUES
(16, 8, 'paid', 120000.00, '2026-04-19 11:12:26'),
(15, 8, 'paid', 120000.00, '2026-04-19 10:57:10'),
(14, 8, 'paid', 120000.00, '2026-04-19 10:42:18'),
(11, 8, 'paid', 120000.00, '2026-04-19 09:11:24'),
(10, 8, 'paid', 60000.00, '2026-04-19 08:54:09');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','done','served') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`)
) ENGINE=MyISAM AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`, `note`, `status`) VALUES
(3, 2, 1, 2, 60000.00, 'Ít cay', 'done'),
(4, 2, 3, 1, 30000.00, NULL, 'done'),
(5, 3, 4, 1, 15000.00, 'cay', 'done'),
(6, 4, 6, 2, 55000.00, 'Ít cay', 'pending'),
(7, 4, 2, 1, 60000.00, NULL, 'pending'),
(8, 5, 5, 2, 20000.00, 'Ít cay', 'done'),
(10, 6, 1, 1, 60000.00, 'cay', 'done'),
(11, 6, 2, 1, 60000.00, NULL, 'done'),
(12, 7, 1, 1, 60000.00, NULL, 'done'),
(13, 8, 2, 1, 60000.00, NULL, 'done'),
(14, 8, 1, 1, 60000.00, NULL, 'done'),
(15, 9, 1, 1, 60000.00, NULL, 'done'),
(16, 9, 2, 1, 60000.00, NULL, 'done'),
(17, 10, 1, 1, 60000.00, NULL, 'served'),
(18, 11, 1, 1, 60000.00, NULL, 'served'),
(19, 11, 2, 1, 60000.00, NULL, 'served'),
(22, 14, 2, 2, 60000.00, NULL, 'served'),
(23, 15, 1, 1, 60000.00, NULL, 'served'),
(24, 15, 1, 1, 60000.00, NULL, 'served'),
(25, 16, 2, 1, 60000.00, 'Không cay', 'served'),
(26, 16, 2, 1, 60000.00, 'Không hành', 'served');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category_id` int DEFAULT NULL,
  `status` enum('available','unavailable') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `image`, `description`, `category_id`, `status`) VALUES
(1, 'Cơm gà đặc biệt', 60000.00, 'https://gahanthuyen.com/wp-content/uploads/2023/08/z4559666669168_be4a07bcbadaae1ec2e65e765178a8dc.jpg', NULL, 1, 'available'),
(2, 'Phở bò', 60000.00, NULL, 'Phở bò truyền thống', 1, 'available'),
(3, 'Trà sữa', 30000.00, NULL, 'Trà sữa trân châu', 2, 'available'),
(4, 'Coca Cola', 15000.00, NULL, NULL, 2, 'available'),
(5, 'Bánh flan', 20000.00, NULL, 'Bánh flan caramel', 3, 'available'),
(6, 'Bún bò', 55000.00, NULL, 'Bún bò Huế truyền thống', 1, 'available');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tables`
--

DROP TABLE IF EXISTS `tables`;
CREATE TABLE IF NOT EXISTS `tables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('available','occupied') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `tables`
--

INSERT INTO `tables` (`id`, `name`, `token`, `status`) VALUES
(1, 'Bàn 1', '12345', 'available'),
(9, 'Bàn 2', '9ac01764bb1b0f5c86503a406af518a3', 'available'),
(7, 'Bàn 7', 'e74e47954d9785ffe4add9d6ee0815c2', 'available'),
(8, 'Bàn 8', '6b65bccfb11248f99e180c0d90113d57', 'available');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','staff','kitchen') COLLATE utf8mb4_unicode_ci DEFAULT 'staff',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2a$12$zy04MV5lownkJLCsVxUmSeY.TghbiQOTtGhdgu48smd5HprRCDfei', 'admin'),
(2, 'staff1', '$2a$12$zy04MV5lownkJLCsVxUmSeY.TghbiQOTtGhdgu48smd5HprRCDfei', 'staff'),
(3, 'kitchen1', '$2a$12$zy04MV5lownkJLCsVxUmSeY.TghbiQOTtGhdgu48smd5HprRCDfei', 'kitchen');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

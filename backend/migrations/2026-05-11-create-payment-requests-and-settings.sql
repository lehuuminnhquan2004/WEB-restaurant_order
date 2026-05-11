CREATE TABLE IF NOT EXISTS `payment_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `table_id` int NOT NULL,
  `table_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` enum('cash','transfer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `status` enum('pending','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `order_ids` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `table_id` (`table_id`),
  KEY `status` (`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_settings` (
  `id` int NOT NULL,
  `transfer_qr_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transfer_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payment_settings` (`id`, `transfer_qr_image`, `transfer_note`)
SELECT 1, '', 'Vui lòng chuyển khoản theo mã QR và báo nhân viên sau khi hoàn tất.'
WHERE NOT EXISTS (SELECT 1 FROM `payment_settings` WHERE `id` = 1);

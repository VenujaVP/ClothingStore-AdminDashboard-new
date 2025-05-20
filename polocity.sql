-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 20, 2025 at 08:10 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `polocity`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `address_id` int(11) NOT NULL,
  `customerID` int(11) NOT NULL,
  `contact_name` varchar(100) NOT NULL,
  `mobile_number` varchar(15) NOT NULL,
  `street_address` varchar(255) NOT NULL,
  `apt_suite_unit` varchar(50) DEFAULT NULL,
  `province` varchar(50) NOT NULL,
  `district` varchar(50) NOT NULL,
  `zip_code` varchar(10) NOT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addresses`
--

INSERT INTO `addresses` (`address_id`, `customerID`, `contact_name`, `mobile_number`, `street_address`, `apt_suite_unit`, `province`, `district`, `zip_code`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 10, 'aaaaaaaaaa', '7777777777', 'AAAAAAAAAAAAA, AAAAAAAAAAAAAAAA, AAAAAAAAAAA', 'AAAAAAAAAAA', 'Southern Province', 'Hambantota', '433534', 0, '2025-04-25 04:36:03', '2025-05-16 09:44:31'),
(2, 10, 'bbbbbbbbbbbbbb', '2222222222222', 'bbbbbbbbbbbbbbbbb, bbbbbbbbb, bbbbbbbbbbbb', 'bb', 'Western Province', 'Gampaha', '5555555', 0, '2025-04-25 04:36:39', '2025-05-14 09:30:45'),
(3, 11, 'dsvsdvsb', '35636346', 'kdddddddddddddd', 'bbbbbbbbbbbbbbbbb', 'Northern Province', 'Kilinochchi', '433534', 0, '2025-05-13 04:10:11', '2025-05-13 04:10:57'),
(4, 11, 'dddddddddddddddddddddddddd', 'e33333', 'vewwwwwwwwwwwwwwwww', 'fbsbszbf sz', 'North Western Province', 'Kurunegala', '333333', 1, '2025-05-13 04:10:57', '2025-05-13 04:10:57'),
(5, 10, 'wenuuuuuuuuuuu', '080562562', 'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww', NULL, 'Eastern', 'ddsddfcdsxfs', '90289', 1, '2025-05-14 09:30:45', '2025-05-14 09:30:45'),
(6, 12, 'kavuhs a', '3453535353', 'new', '6457675', 'North Central Province', 'Anuradhapura', '6545764', 0, '2025-05-16 15:01:32', '2025-05-16 15:01:32');

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `cart_item_id` int(11) NOT NULL,
  `customerID` int(11) NOT NULL,
  `ProductID` varchar(10) NOT NULL,
  `VariationID` int(11) NOT NULL,
  `quantity` int(11) NOT NULL CHECK (`quantity` > 0),
  `added_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart_items`
--

INSERT INTO `cart_items` (`cart_item_id`, `customerID`, `ProductID`, `VariationID`, `quantity`, `added_at`, `updated_at`) VALUES
(20, 11, 'P002', 4, 5, '2025-05-17 04:11:16', '2025-05-17 04:11:16');

-- --------------------------------------------------------

--
-- Table structure for table `colors`
--

CREATE TABLE `colors` (
  `ColorID` int(11) NOT NULL,
  `ColorValue` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `colors`
--

INSERT INTO `colors` (`ColorID`, `ColorValue`) VALUES
(4, 'Black'),
(2, 'Blue'),
(8, 'Gray'),
(3, 'Green'),
(10, 'Orange'),
(7, 'Pink'),
(9, 'Purple'),
(1, 'Red'),
(5, 'White'),
(6, 'Yellow');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `ID` int(11) NOT NULL,
  `NAME` varchar(255) NOT NULL,
  `EMAIL` varchar(255) NOT NULL,
  `PHONE_NUM` varchar(15) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `resetToken` varchar(255) DEFAULT NULL,
  `resetTokenExpiry` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`ID`, `NAME`, `EMAIL`, `PHONE_NUM`, `PASSWORD`, `resetToken`, `resetTokenExpiry`, `createdAt`, `updatedAt`) VALUES
(10, 'Venuja Prasanjith', 'venujagamage2002@gmail.com', '5654765765', '$2b$10$7qj1TXVofEAHQNsrFcTQzeXN2FMGddFLHwwp5AqTTR3vzCEliTQJy', NULL, NULL, '2025-04-25 04:33:08', '2025-05-18 07:09:18'),
(11, 'Venuja Prasanjith', 'airdropvpcryptonew@gmail.com', '5654765765', '$2b$10$gBc8cXL1Y4nMWZjUKhRHIOl9bv41W3C2hEKhwiDaTaOKJVm2vvcpG', NULL, NULL, '2025-05-13 04:07:00', '2025-05-13 04:07:00'),
(12, 'kavisha Shehani', 'venujaeducation@gmail.com', '0725699508', '$2b$10$FaSL9XpbiW2qMKEtATQi4epFH.I7Wc4ayxb0AdwnDzhY2YB4tAN6a', NULL, NULL, '2025-05-16 15:00:36', '2025-05-16 15:00:36');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_options`
--

CREATE TABLE `delivery_options` (
  `delivery_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `cost` decimal(10,2) NOT NULL,
  `estimated_days` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `delivery_options`
--

INSERT INTO `delivery_options` (`delivery_id`, `name`, `description`, `cost`, `estimated_days`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Standard Delivery', 'Delivery within 3-5 working days', 350.00, 5, 1, '2025-05-14 13:03:55', '2025-05-17 23:56:36'),
(2, 'Express Delivery', 'Delivery within 1-2 working days', 600.00, 2, 1, '2025-05-14 13:03:55', '2025-05-17 23:56:39'),
(3, 'Same Day Delivery', 'Delivery on the same day for Colombo area', 800.00, 0, 1, '2025-05-14 13:03:55', '2025-05-14 13:03:55');

-- --------------------------------------------------------

--
-- Table structure for table `employeedetails`
--

CREATE TABLE `employeedetails` (
  `EMPLOYEE_ID` int(11) NOT NULL,
  `USERNAME` varchar(255) NOT NULL,
  `EMAIL` varchar(255) NOT NULL,
  `F_NAME` varchar(50) NOT NULL,
  `L_NAME` varchar(50) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `ENTRY_DATE` datetime NOT NULL,
  `ROLE` varchar(50) NOT NULL,
  `PHONE_NUM1` varchar(15) DEFAULT NULL,
  `PHONE_NUM2` varchar(15) DEFAULT NULL,
  `resetToken` varchar(255) DEFAULT NULL,
  `resetTokenExpiry` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employeedetails`
--

INSERT INTO `employeedetails` (`EMPLOYEE_ID`, `USERNAME`, `EMAIL`, `F_NAME`, `L_NAME`, `PASSWORD`, `ENTRY_DATE`, `ROLE`, `PHONE_NUM1`, `PHONE_NUM2`, `resetToken`, `resetTokenExpiry`, `createdAt`, `updatedAt`) VALUES
(14, 'fesgrdbd232', 'airdropvpcryptonew@gmail.com', 'gggfdgdg', 'gdgbdtbfdb', '$2b$10$FA7sISZLwTV5yPBdnj/V9eGz68WdztWHVFCZx9eHppC9wxme/k/vK', '2025-05-13 00:00:00', 'manager', '0703881642', '0703881642', NULL, NULL, '2025-05-13 18:46:34', '2025-05-13 18:46:34');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `expenses_id` int(11) NOT NULL,
  `expense_custom_id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `expenses_name` varchar(255) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`expenses_id`, `expense_custom_id`, `date`, `expenses_name`, `cost`, `description`, `createdAt`, `updatedAt`) VALUES
(1, 'EXP-250517-2800', '2025-05-17', 'eerrrerre', 4000.00, '22222222222', '2025-05-17 10:06:29', '2025-05-17 10:06:29');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `order_item_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `address_id` int(11) NOT NULL,
  `delivery_option_id` int(11) NOT NULL,
  `payment_option_id` int(11) NOT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `product_id` varchar(10) NOT NULL,
  `variation_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `delivery_fee` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `order_status` enum('Unpaid','Processing','To be Shipped','Shipped','Delivered','Failed','Cancelled','Refunded') DEFAULT 'Unpaid',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `order_item_id`, `customer_id`, `address_id`, `delivery_option_id`, `payment_option_id`, `payment_id`, `product_id`, `variation_id`, `quantity`, `unit_price`, `total_price`, `delivery_fee`, `total_amount`, `order_status`, `created_at`, `updated_at`) VALUES
(41, 2147483647, 10, 5, 1, 2, 17, '2w2w2w', 111, 4, 22.00, 88.00, 350.00, 438.00, 'Processing', '2025-05-18 06:56:18', '2025-05-19 09:05:41'),
(42, 2147483647, 10, 5, 1, 2, 15, '2w2w2w', 112, 7, 22.00, 154.00, 350.00, 504.00, 'Processing', '2025-05-18 08:10:43', '2025-05-19 09:04:55'),
(43, 2147483647, 10, 5, 1, 2, 16, '2w2w2w', 111, 6, 22.00, 132.00, 350.00, 482.00, 'Refunded', '2025-05-18 19:25:21', '2025-05-19 17:03:00'),
(44, 2147483647, 10, 5, 1, 2, NULL, '2w2w2w', 112, 2, 22.00, 44.00, 350.00, 394.00, 'Delivered', '2025-05-19 07:02:29', '2025-05-19 14:33:26');

-- --------------------------------------------------------

--
-- Table structure for table `order_tracking`
--

CREATE TABLE `order_tracking` (
  `tracking_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `employee_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `delivery_date` date DEFAULT NULL,
  `courier_agent_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_tracking`
--

INSERT INTO `order_tracking` (`tracking_id`, `order_id`, `tracking_number`, `employee_id`, `created_at`, `updated_at`, `delivery_date`, `courier_agent_id`) VALUES
(1, 44, '86657465336', 4, '2025-05-19 11:08:59', '2025-05-19 14:33:26', '2025-05-19', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `owners`
--

CREATE TABLE `owners` (
  `ID` int(11) NOT NULL,
  `EMAIL` varchar(255) NOT NULL,
  `PHONE_NUM` varchar(15) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `resetToken` varchar(255) DEFAULT NULL,
  `resetTokenExpiry` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `F_NAME` varchar(255) DEFAULT NULL,
  `L_NAME` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `owners`
--

INSERT INTO `owners` (`ID`, `EMAIL`, `PHONE_NUM`, `PASSWORD`, `resetToken`, `resetTokenExpiry`, `createdAt`, `updatedAt`, `F_NAME`, `L_NAME`) VALUES
(10, 'venujagamage2002@gmail.com', '1234567890', '$2b$10$kCH/XllJK0oU2osicHQWTOjCY2G8kYMaPAnDDnGq3tGlM4S65uW8O', NULL, NULL, '2025-05-16 08:06:01', '2025-05-16 08:06:29', 'John', 'Doe'),
(11, 'jane.smith@example.com', '0987654321', 'hashed_password_2', NULL, NULL, '2025-05-16 08:06:01', '2025-05-16 08:06:01', 'Jane', 'Smith'),
(12, 'michael.brown@example.com', '1122334455', 'hashed_password_3', 'resetToken123', '2025-06-01 12:00:00', '2025-05-16 08:06:01', '2025-05-16 08:06:01', 'Michael', 'Brown'),
(13, 'emily.jones@example.com', '6677889900', 'hashed_password_4', NULL, NULL, '2025-05-16 08:06:01', '2025-05-16 08:06:01', 'Emily', 'Jones');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `payment_method_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_intent_id` varchar(255) DEFAULT NULL,
  `payment_status` enum('pending','completed','failed') DEFAULT 'pending',
  `transaction_reference` varchar(255) DEFAULT NULL,
  `payment_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `payment_method_id`, `amount`, `payment_intent_id`, `payment_status`, `transaction_reference`, `payment_date`, `created_at`, `updated_at`) VALUES
(15, 2, 504.00, 'pi_3RQ2JK2aAuwJgETx052IqGZ6', 'completed', NULL, '2025-05-18 08:11:07', '2025-05-18 08:11:06', '2025-05-18 08:11:07'),
(16, 2, 482.00, 'pi_3RQCqI2aAuwJgETx0aNZPIbM', '', NULL, '2025-05-18 19:25:52', '2025-05-18 19:25:51', '2025-05-19 17:03:00'),
(17, 2, 438.00, 'pi_3RQCsm2aAuwJgETx0FrFMTj2', 'completed', NULL, '2025-05-18 19:28:26', '2025-05-18 19:28:25', '2025-05-18 19:28:26');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `payment_method_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_online_payment` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`payment_method_id`, `name`, `description`, `is_online_payment`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Cash on Delivery', 'Pay when you receive your items', 0, 1, '2025-05-14 13:03:55', '2025-05-14 13:03:55'),
(2, 'Credit/Debit Card', 'Secure online payment with any major card', 1, 1, '2025-05-14 13:03:55', '2025-05-14 13:03:55');

-- --------------------------------------------------------

--
-- Table structure for table `polocity_panel_users`
--

CREATE TABLE `polocity_panel_users` (
  `ID` int(11) NOT NULL,
  `USERNAME` varchar(255) NOT NULL,
  `EMAIL` varchar(255) NOT NULL,
  `F_NAME` varchar(255) DEFAULT NULL,
  `L_NAME` varchar(255) DEFAULT NULL,
  `PHONE_NUM1` varchar(15) DEFAULT NULL,
  `PHONE_NUM2` varchar(15) DEFAULT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `ROLE` enum('admin','employee','cashier','onlineorderchecker') NOT NULL,
  `resetToken` varchar(255) DEFAULT NULL,
  `resetTokenExpiry` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tempEmail` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `polocity_panel_users`
--

INSERT INTO `polocity_panel_users` (`ID`, `USERNAME`, `EMAIL`, `F_NAME`, `L_NAME`, `PHONE_NUM1`, `PHONE_NUM2`, `PASSWORD`, `ROLE`, `resetToken`, `resetTokenExpiry`, `createdAt`, `updatedAt`, `tempEmail`) VALUES
(3, 'venujaeducation913', 'venujaeducation@gmail.com', 'Venuja', 'Prasanjith', '1111111111', NULL, '$2b$10$7qj1TXVofEAHQNsrFcTQzeXN2FMGddFLHwwp5AqTTR3vzCEliTQJy', 'admin', NULL, NULL, '2025-05-18 09:34:34', '2025-05-19 09:57:52', NULL),
(4, 'fdgbedgb', 'venujagamage2002@gmail.com', 'gemaaa', 'dddddddddd', '2222222222', '2222222227', '$2b$10$7qj1TXVofEAHQNsrFcTQzeXN2FMGddFLHwwp5AqTTR3vzCEliTQJy', 'onlineorderchecker', NULL, NULL, '2025-05-18 09:35:19', '2025-05-19 09:57:57', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_table`
--

CREATE TABLE `product_table` (
  `ProductID` varchar(10) NOT NULL,
  `ProductName` varchar(255) NOT NULL,
  `ProductDescription` text DEFAULT NULL,
  `UnitPrice` decimal(10,2) NOT NULL,
  `DateAdded` date NOT NULL,
  `ShippingWeight` decimal(5,2) DEFAULT NULL,
  `Category1` varchar(100) NOT NULL,
  `Category2` varchar(100) DEFAULT NULL,
  `Category3` varchar(100) DEFAULT NULL,
  `Material` varchar(100) DEFAULT NULL,
  `FabricType` varchar(100) DEFAULT NULL,
  `ReturnPolicy` varchar(50) DEFAULT NULL,
  `WishlistCount` int(11) DEFAULT 0,
  `FinalRating` decimal(3,2) DEFAULT 0.00,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `IsActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_table`
--

INSERT INTO `product_table` (`ProductID`, `ProductName`, `ProductDescription`, `UnitPrice`, `DateAdded`, `ShippingWeight`, `Category1`, `Category2`, `Category3`, `Material`, `FabricType`, `ReturnPolicy`, `WishlistCount`, `FinalRating`, `createdAt`, `updatedAt`, `IsActive`) VALUES
('2w2w2w', 'wwwwww', 'wwwwwwwwwwwwwwwww', 22.00, '2025-05-14', 22.00, 'KIDS & BABY', 'Girls\' Clothing (3-16)', NULL, NULL, NULL, NULL, 2, 0.00, '2025-05-14 06:40:47', '2025-05-18 07:29:58', 1),
('p0008377', 'MENDES TROUSERS – Frescobol Carioca', 'MENDES TROUSERS – Frescobol Carioca', 1000.00, '2025-05-15', 0.40, 'MEN', 'Bottoms', 'Trousers', 'Wool', 'Chiffon', 'ddfddss', 0, 4.00, '2025-05-16 03:16:06', '2025-05-17 16:20:06', 1),
('P001', 'Floral Printed Blouse', 'A stylish floral printed blouse for casual wear.', 19.00, '2025-03-16', 0.50, 'WOMEN', 'Tops & Tees', 'Crop Tops', 'Cotton', 'Velvet', '7 days return', 0, 1.00, '2025-03-16 15:19:56', '2025-03-17 08:46:16', 1),
('P002', 'Black Crop Top', 'Trendy black crop top for summer outfits.', 15.00, '2025-03-16', 0.30, 'WOMEN', 'Tops & Tees', 'Crop Tops', 'Cotton', 'Satin', '7 days return', 0, 0.00, '2025-03-16 15:21:33', '2025-03-16 15:21:33', 1),
('P004', 'Knitted Sweater', 'Warm and cozy knitted sweater for winter.', 29.00, '2025-03-16', 0.80, 'WOMEN', 'Tops & Tees', 'Hoodies & Sweaters', 'Wool', 'Ribbed', '14 days return', 0, 4.00, '2025-03-16 15:24:07', '2025-05-16 08:12:04', 1),
('P006', 'Denim Skirt', 'A stylish denim skirt for casual outfits.', 25.00, '2025-03-16', 0.60, 'WOMEN', 'Dresses & Bottoms', 'Skirts', 'Denim', 'Canvas', 'No return', 0, 4.00, '2025-03-16 15:30:13', '2025-05-16 08:12:08', 1),
('P010', 'Silk Nightwear Set', 'Comfortable silk nightwear set for a luxurious sleep.', 45.00, '2025-03-16', 0.40, 'WOMEN', 'Special Categories', 'Night & Loungewear', 'Silk', 'Satin', '7 days return', 0, 4.00, '2025-03-16 15:32:32', '2025-05-16 08:12:11', 1);

-- --------------------------------------------------------

--
-- Table structure for table `product_variations`
--

CREATE TABLE `product_variations` (
  `VariationID` int(11) NOT NULL,
  `ProductID` varchar(10) NOT NULL,
  `SizeID` int(11) NOT NULL,
  `ColorID` int(11) NOT NULL,
  `units` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_variations`
--

INSERT INTO `product_variations` (`VariationID`, `ProductID`, `SizeID`, `ColorID`, `units`) VALUES
(4, 'P002', 3, 4, 15),
(9, 'P004', 5, 3, 5),
(10, 'P004', 4, 9, 4),
(11, 'P004', 1, 9, 3),
(16, 'P006', 3, 4, 20),
(17, 'P006', 4, 4, 19),
(24, 'P010', 3, 1, 30),
(25, 'P010', 2, 5, 11),
(97, 'P001', 1, 1, 200),
(98, 'P001', 1, 1, 6600),
(99, 'P001', 1, 1, 200),
(111, '2w2w2w', 5, 7, 10),
(112, '2w2w2w', 2, 3, 9),
(113, 'p0008377', 2, 5, 10),
(114, 'p0008377', 3, 5, 98);

-- --------------------------------------------------------

--
-- Table structure for table `sizes`
--

CREATE TABLE `sizes` (
  `SizeID` int(11) NOT NULL,
  `SizeValue` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sizes`
--

INSERT INTO `sizes` (`SizeID`, `SizeValue`) VALUES
(4, 'L'),
(3, 'M'),
(2, 'S'),
(5, 'XL'),
(1, 'XS'),
(6, 'XXL'),
(8, 'XXXL');

-- --------------------------------------------------------

--
-- Table structure for table `wishlists`
--

CREATE TABLE `wishlists` (
  `wishlist_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` varchar(10) NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wishlists`
--

INSERT INTO `wishlists` (`wishlist_id`, `customer_id`, `product_id`, `added_at`) VALUES
(6, 11, '2w2w2w', '2025-05-17 04:04:50'),
(7, 10, '2w2w2w', '2025-05-18 07:29:58');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`address_id`),
  ADD KEY `customerID` (`customerID`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`cart_item_id`),
  ADD UNIQUE KEY `unique_user_product_variation` (`customerID`,`ProductID`,`VariationID`),
  ADD KEY `ProductID` (`ProductID`),
  ADD KEY `VariationID` (`VariationID`);

--
-- Indexes for table `colors`
--
ALTER TABLE `colors`
  ADD PRIMARY KEY (`ColorID`),
  ADD UNIQUE KEY `ColorValue` (`ColorValue`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `EMAIL` (`EMAIL`);

--
-- Indexes for table `delivery_options`
--
ALTER TABLE `delivery_options`
  ADD PRIMARY KEY (`delivery_id`);

--
-- Indexes for table `employeedetails`
--
ALTER TABLE `employeedetails`
  ADD PRIMARY KEY (`EMPLOYEE_ID`),
  ADD UNIQUE KEY `EMAIL` (`EMAIL`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`expenses_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `address_id` (`address_id`),
  ADD KEY `delivery_option_id` (`delivery_option_id`),
  ADD KEY `payment_option_id` (`payment_option_id`),
  ADD KEY `idx_customer` (`customer_id`),
  ADD KEY `idx_product` (`product_id`),
  ADD KEY `idx_variation` (`variation_id`),
  ADD KEY `idx_order_status` (`order_status`),
  ADD KEY `idx_payment` (`payment_id`);

--
-- Indexes for table `order_tracking`
--
ALTER TABLE `order_tracking`
  ADD PRIMARY KEY (`tracking_id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `idx_order_tracking` (`order_id`),
  ADD KEY `idx_tracking_date` (`created_at`);

--
-- Indexes for table `owners`
--
ALTER TABLE `owners`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `payment_method_id` (`payment_method_id`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `idx_payment_intent` (`payment_intent_id`),
  ADD KEY `idx_payment_date` (`payment_date`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`payment_method_id`);

--
-- Indexes for table `polocity_panel_users`
--
ALTER TABLE `polocity_panel_users`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `EMAIL` (`EMAIL`);

--
-- Indexes for table `product_table`
--
ALTER TABLE `product_table`
  ADD PRIMARY KEY (`ProductID`);

--
-- Indexes for table `product_variations`
--
ALTER TABLE `product_variations`
  ADD PRIMARY KEY (`VariationID`),
  ADD KEY `ProductID` (`ProductID`),
  ADD KEY `SizeID` (`SizeID`),
  ADD KEY `ColorID` (`ColorID`);

--
-- Indexes for table `sizes`
--
ALTER TABLE `sizes`
  ADD PRIMARY KEY (`SizeID`),
  ADD UNIQUE KEY `SizeValue` (`SizeValue`);

--
-- Indexes for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD PRIMARY KEY (`wishlist_id`),
  ADD UNIQUE KEY `unique_wishlist_entry` (`customer_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `address_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `cart_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `colors`
--
ALTER TABLE `colors`
  MODIFY `ColorID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `delivery_options`
--
ALTER TABLE `delivery_options`
  MODIFY `delivery_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `employeedetails`
--
ALTER TABLE `employeedetails`
  MODIFY `EMPLOYEE_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `expenses_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `order_tracking`
--
ALTER TABLE `order_tracking`
  MODIFY `tracking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `owners`
--
ALTER TABLE `owners`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `payment_method_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `polocity_panel_users`
--
ALTER TABLE `polocity_panel_users`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `product_variations`
--
ALTER TABLE `product_variations`
  MODIFY `VariationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- AUTO_INCREMENT for table `sizes`
--
ALTER TABLE `sizes`
  MODIFY `SizeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `wishlists`
--
ALTER TABLE `wishlists`
  MODIFY `wishlist_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `addresses`
--
ALTER TABLE `addresses`
  ADD CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`customerID`) REFERENCES `customers` (`ID`) ON DELETE CASCADE;

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`customerID`) REFERENCES `customers` (`ID`),
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`ProductID`) REFERENCES `product_table` (`ProductID`),
  ADD CONSTRAINT `cart_items_ibfk_3` FOREIGN KEY (`VariationID`) REFERENCES `product_variations` (`VariationID`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`ID`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`),
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`delivery_option_id`) REFERENCES `delivery_options` (`delivery_id`),
  ADD CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`payment_option_id`) REFERENCES `payment_methods` (`payment_method_id`),
  ADD CONSTRAINT `orders_ibfk_5` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`),
  ADD CONSTRAINT `orders_ibfk_6` FOREIGN KEY (`product_id`) REFERENCES `product_table` (`ProductID`),
  ADD CONSTRAINT `orders_ibfk_7` FOREIGN KEY (`variation_id`) REFERENCES `product_variations` (`VariationID`);

--
-- Constraints for table `order_tracking`
--
ALTER TABLE `order_tracking`
  ADD CONSTRAINT `order_tracking_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_tracking_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `polocity_panel_users` (`ID`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`payment_method_id`);

--
-- Constraints for table `product_variations`
--
ALTER TABLE `product_variations`
  ADD CONSTRAINT `product_variations_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `product_table` (`ProductID`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_variations_ibfk_2` FOREIGN KEY (`SizeID`) REFERENCES `sizes` (`SizeID`),
  ADD CONSTRAINT `product_variations_ibfk_3` FOREIGN KEY (`ColorID`) REFERENCES `colors` (`ColorID`);

--
-- Constraints for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlists_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product_table` (`ProductID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

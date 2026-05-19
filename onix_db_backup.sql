-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: onix_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `about_content`
--

DROP TABLE IF EXISTS `about_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `about_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content_key` varchar(100) NOT NULL,
  `content_value` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_key` (`content_key`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `about_content`
--

LOCK TABLES `about_content` WRITE;
/*!40000 ALTER TABLE `about_content` DISABLE KEYS */;
INSERT INTO `about_content` VALUES (1,'narrative','Architecture is about experience, not only visual. We design spaces that balance right material and proportion, inspired by contemporary study and timeless craft. Our work is a dialogue between the built and the lived ÔÇö where structure meets sensitivity, and form follows feeling. Every project begins with deep listening, ends in precise execution, and exists to elevate the human experience.','2026-04-05 10:42:15'),(2,'mission','To shape environments that endure ÔÇö not just in material, but in memory.','2026-04-05 10:42:15');
/*!40000 ALTER TABLE `about_content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,'admin','$2b$10$mhzj5vO/OK8152F4EF4LKej1krrFf9mapolNId.QqHK6ijkpLrJiS','2026-04-05 10:42:38');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `target_page` varchar(20) DEFAULT 'both',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'The Glass Pavilion','Architecture','A transparent sanctuary immersed in nature ÔÇö where boundaries between inside and outside dissolve.','/images/projects/project_01.jpg',1,1,'2026-04-05 10:42:15','both'),(2,'Meridian House','Residential','A contemporary family home sculpted from concrete and warmth, designed for connection.','/images/projects/project_02.jpg',2,1,'2026-04-05 10:42:15','both'),(3,'The Cascade Stair','Interior Design','A floating staircase that becomes the soul of a luxury penthouse.','/images/projects/project_03.jpg',3,1,'2026-04-05 10:42:15','both'),(4,'Luminary Tower','Commercial','An urban mixed-use development defining a new skyline landmark.','/images/projects/project_04.jpg',4,1,'2026-04-05 10:42:15','both'),(5,'Serenity Suite','Interior Design','A private residence bedroom suite draped in natural textures and calm.','/images/projects/project_05.jpg',5,1,'2026-04-05 10:42:15','both'),(6,'Courtyard Residence','Residential','A family home organized around a private courtyard, creating natural light and privacy in equal measure.','/images/projects/project_06.jpg',6,0,'2026-04-05 10:42:15','both'),(7,'Agahozo','archicteture','wee','/images/projects/1775385998082-308.jpg',3,1,'2026-04-05 10:46:38','both'),(8,'Rustiro','interior','i mean it','/images/projects/1775388113359-877.jpg',3,1,'2026-04-05 11:21:54','both'),(9,'audace','interior','wee','/images/projects/1775388398686-286.jpg',1,0,'2026-04-05 11:26:38','both'),(10,'Project','interior','aa','/images/projects/1775643136866-180.jpg',3,1,'2026-04-08 10:12:17','both'),(11,'web','archicteture','wee','/images/projects/1775643745729-413.jpg',3,1,'2026-04-08 10:22:26','both'),(12,'my site','archicteture','wee','/images/projects/1775644517385-817.png',3,0,'2026-04-08 10:35:17','both'),(13,'aa','architecture','wee','/images/projects/1775645405527-868.jpg',3,0,'2026-04-08 10:50:05','home'),(14,'wee','archicteture','wee','/images/projects/1775645549987-49.jpg',2,1,'2026-04-08 10:52:30','work'),(15,'may','archicteture','wee','/images/projects/1775650788360-265.jpg',3,1,'2026-04-08 12:19:48','both');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'Architecture','We design buildings that balance function and artistry ÔÇö from initial concept to final structure, every detail considered.','building',1,1),(2,'Interior Design','Curating interior environments that reflect personality, purpose, and exceptional craftsmanship.','layout',2,1),(3,'Sustainable Design','Integrating eco-conscious principles into modern design ÔÇö minimizing footprint while maximizing beauty.','leaf',3,1),(4,'Brand Identity','Crafting visual identities for architecture and design firms, anchored in strategy and refined aesthetics.','award',4,1),(5,'Construction Consulting','Expert guidance through the construction process ÔÇö ensuring quality, timelines, and vision are preserved.','tool',5,1),(6,'interior','weee','building',1,0),(7,'exterior','i mean it my brother','building',2,1);
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'site_name','Onix Studio','2026-04-05 10:42:15'),(2,'hero_video_path','/uploads/1775645882248-138.mp4','2026-04-08 11:09:36'),(3,'hero_title','Architecture is Experience','2026-04-05 10:42:15'),(4,'hero_subtitle','We craft spaces that transcend the ordinary ÔÇö balancing material, light, and proportion into living art.','2026-04-05 10:42:15'),(5,'footer_text','® 2026 Onix Studio. All rights reserved.','2026-04-08 13:00:35');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_photos`
--

DROP TABLE IF EXISTS `team_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_photos`
--

LOCK TABLES `team_photos` WRITE;
/*!40000 ALTER TABLE `team_photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workshops`
--

DROP TABLE IF EXISTS `workshops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workshops` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `learn_more` text DEFAULT NULL,
  `our_speakers` text DEFAULT NULL,
  `business_knowledge` text DEFAULT NULL,
  `date_label` varchar(100) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workshops`
--

LOCK TABLES `workshops` WRITE;
/*!40000 ALTER TABLE `workshops` DISABLE KEYS */;
INSERT INTO `workshops` VALUES (1,'Foundations of Modern Architecture','An intensive exploration of contemporary architectural theory and practice.','Learn from the best in the industry ÔÇö our workshops bring together leading architects, designers, and thinkers to share methodologies, case studies, and hands-on experience.','Our speakers include award-winning architects, urban planners, and design innovators who have shaped landmark projects across the globe.','Improve your business knowledge with sessions on client acquisition, project management, fee structures, and building a sustainable architecture practice.','Spring 2026',1,NULL),(2,'Interior Design Mastery','Deep-dive into the principles and practices of high-end interior environments.','Learn directly from industry-defining interior designers who blend culture, material science, and spatial psychology into transformative spaces.','Featuring principals from top-tier international design studios, our speakers bring real-world experience and unconventional perspectives.','Understand how interior design firms operate ÔÇö from pitch to delivery ÔÇö and how to position your practice in a competitive market.','Summer 2026',2,NULL),(3,'Sustainable Architecture Workshop','Practical strategies for designing environmentally responsible buildings.','Our sustainability experts teach proven methods for reducing environmental impact while achieving stunning design results.','Speakers include LEED-certified designers, environmental engineers, and policy advisors working at the frontier of green construction.','Discover how sustainability is becoming a business differentiator ÔÇö attracting clients, meeting regulations, and future-proofing your practice.','Autumn 2026',3,NULL),(4,'onix','May be it is time for making change','many','Audilla','eh','Spring 2026',2,1);
/*!40000 ALTER TABLE `workshops` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-08 22:00:50

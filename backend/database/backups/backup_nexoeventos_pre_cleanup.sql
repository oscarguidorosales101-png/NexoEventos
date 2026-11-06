-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: nexoeventos
-- ------------------------------------------------------
-- Server version	8.0.40

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
-- Current Database: `nexoeventos`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `nexoeventos` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `nexoeventos`;

--
-- Table structure for table `agenda_integrantes`
--

DROP TABLE IF EXISTS `agenda_integrantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agenda_integrantes` (
  `id_agenda` int NOT NULL,
  `id_usuario` int NOT NULL,
  `fecha_asignacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_agenda`,`id_usuario`),
  KEY `idx_integrantes_usuario` (`id_usuario`),
  CONSTRAINT `fk_integrantes_agenda` FOREIGN KEY (`id_agenda`) REFERENCES `agendas` (`id_agenda`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_integrantes_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agenda_integrantes`
--

LOCK TABLES `agenda_integrantes` WRITE;
/*!40000 ALTER TABLE `agenda_integrantes` DISABLE KEYS */;
INSERT INTO `agenda_integrantes` VALUES (1,2,'2026-11-05 10:31:17'),(2,1,'2026-11-05 10:31:17'),(2,2,'2026-11-05 10:31:17'),(3,1,'2026-11-05 10:31:17'),(3,2,'2026-11-05 10:31:17'),(4,2,'2026-11-05 12:30:40'),(5,1,'2026-11-05 10:31:17'),(5,2,'2026-11-05 10:31:17'),(16,1,'2026-11-05 12:31:09');
/*!40000 ALTER TABLE `agenda_integrantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agenda_notas`
--

DROP TABLE IF EXISTS `agenda_notas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agenda_notas` (
  `id_nota` int NOT NULL AUTO_INCREMENT,
  `id_agenda` int NOT NULL,
  `id_usuario` int NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `completada` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_limite` datetime DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_nota`),
  KEY `idx_notas_agenda` (`id_agenda`),
  KEY `idx_notas_usuario` (`id_usuario`),
  CONSTRAINT `fk_notas_agenda` FOREIGN KEY (`id_agenda`) REFERENCES `agendas` (`id_agenda`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agenda_notas`
--

LOCK TABLES `agenda_notas` WRITE;
/*!40000 ALTER TABLE `agenda_notas` DISABLE KEYS */;
INSERT INTO `agenda_notas` VALUES (1,1,2,'Medir voltaje disponible en la zona del jardín para el generador de respaldo.',1,'2026-11-03 14:00:00','2026-11-05 10:31:17'),(2,2,2,'Confirmar alternativas de menú para 12 asistentes con dieta vegetariana y celíaca.',1,'2026-11-04 09:30:00','2026-11-05 10:31:17'),(3,3,2,'Verificar que las consolas DMX reconozcan las cabezas móviles nuevas.',0,'2026-11-05 16:00:00','2026-11-05 10:31:17'),(4,4,1,'Imprimir 250 credenciales plastificadas con cordón dorado institucional.',1,'2026-11-06 11:00:00','2026-11-05 10:31:17'),(5,5,1,'Coordinar la llegada de los floristas para armado de arco nupcial a las 13:00.',0,'2026-11-07 13:00:00','2026-11-05 10:31:17'),(6,5,2,'Comprobar microfonía inalámbrica de votos matrimoniales.',0,'2026-11-07 15:30:00','2026-11-05 10:31:17'),(14,16,2,'DIspersion de problemas',1,NULL,'2026-11-05 12:34:23'),(15,16,2,'Problemas de diferentes tipos',1,NULL,'2026-11-05 12:34:36');
/*!40000 ALTER TABLE `agenda_notas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agendas`
--

DROP TABLE IF EXISTS `agendas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agendas` (
  `id_agenda` int NOT NULL AUTO_INCREMENT,
  `id_categoria` int NOT NULL,
  `id_evento` int DEFAULT NULL,
  `id_responsable` int NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `ubicacion` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imagen_portada` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'programada',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_agenda`),
  UNIQUE KEY `uq_evento_agenda_principal` (((case when ((`id_categoria` = 1) and (`id_evento` is not null)) then `id_evento` else NULL end))),
  KEY `idx_agendas_categoria` (`id_categoria`),
  KEY `idx_agendas_evento` (`id_evento`),
  KEY `idx_agendas_responsable` (`id_responsable`),
  KEY `idx_agendas_rango_fechas` (`fecha_inicio`,`fecha_fin`),
  KEY `idx_agendas_estado` (`estado`),
  CONSTRAINT `fk_agendas_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_agenda` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_agendas_evento` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_agendas_responsable` FOREIGN KEY (`id_responsable`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agendas`
--

LOCK TABLES `agendas` WRITE;
/*!40000 ALTER TABLE `agendas` DISABLE KEYS */;
INSERT INTO `agendas` VALUES (1,2,2,2,'Reunión Preliminar con Proveedores de Sonido','Inspección técnica de acometidas eléctricas y acústica del salón principal.','2026-11-03 15:00:00','2026-11-03 16:30:00','Hacienda El Paraíso, La Calera',NULL,'completada','2026-11-05 10:31:17','2026-11-05 10:50:17'),(2,2,1,2,'Alineación de Logística y Banquete Corporativo','Revisión final de tiempos de servicio, opciones de menú y asignación de mesas.','2026-11-04 10:00:00','2026-11-04 11:30:00','Sala de Juntas NexoEventos',NULL,'completada','2026-11-05 10:31:17','2026-11-05 10:31:17'),(3,3,1,2,'Montaje Técnico y Prueba de Iluminación DMX','Calibración de robóticas, pantallas LED y chequeo de sonido lineal.','2026-11-05 14:00:00','2026-11-05 17:00:00','Centro de Convenciones Ágora - Gran Diamante',NULL,'en_progreso','2026-11-05 10:31:17','2026-11-05 10:31:17'),(4,4,1,1,'Cierre de Confirmaciones y Entrega de Escarapelas','Fecha límite para emisión de códigos QR y entrega de material a comité anfitrión.','2026-11-06 09:00:00','2026-11-06 12:00:00','Sede Administrativa NexoEventos',NULL,'programada','2026-11-05 10:31:17','2026-11-05 10:31:17'),(5,1,2,1,'Boda Real Carolina y Fernando — Ceremonia y Recepción','Planificación integral y coordinación en vivo de la boda, banquete y show musical.','2026-11-07 16:00:00','2026-11-07 23:00:00','Hacienda El Paraíso, La Calera',NULL,'programada','2026-11-05 10:31:17','2026-11-05 10:31:17'),(16,2,11,1,'Reporte de la semana.',NULL,'2026-11-05 10:00:00','2026-11-05 11:00:00','Manuel Mora',NULL,'programada','2026-11-05 12:31:09','2026-11-05 12:31:09'),(61,1,NULL,2,'ednedndln',NULL,'2026-11-05 10:00:00','2026-11-05 11:00:00','Manuel Mora',NULL,'programada','2026-11-05 14:17:05','2026-11-05 14:17:05');
/*!40000 ALTER TABLE `agendas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_agenda`
--

DROP TABLE IF EXISTS `categorias_agenda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_agenda` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_agenda`
--

LOCK TABLES `categorias_agenda` WRITE;
/*!40000 ALTER TABLE `categorias_agenda` DISABLE KEYS */;
INSERT INTO `categorias_agenda` VALUES (1,'Event','#D4AF37','Eventos principales y ceremonias contratadas.'),(2,'Meeting','#3B82F6','Reuniones de coordinación y comités con clientes o proveedores.'),(3,'Setup and Rehearsal','#F59E0B','Montajes técnicos, ensayos generales y pruebas de sonido e iluminación.'),(4,'Task Deadlines','#EC4899','Hitos clave y fechas límite de entregas operativas.');
/*!40000 ALTER TABLE `categorias_agenda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `tipo_cliente` enum('persona','empresa') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cliente`),
  KEY `idx_clientes_tipo` (`tipo_cliente`),
  KEY `idx_clientes_correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'empresa','Corporación Innova Tech S.A.S.','contacto@innovatech.com','+57 3105551234','Calle 100 # 15-20, Bogotá','2026-11-05 09:22:02'),(2,'persona','Carolina Mendoza Ruiz','carolina.mendoza@email.com','+57 3208889900','Carrera 7 # 45-12, Medellín','2026-11-05 09:22:02'),(3,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793892618779@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 09:30:18'),(5,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793893413846@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 09:43:34'),(7,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793897022084@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 10:43:42'),(9,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793897238976@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 10:47:19'),(11,'empresa','OSCAR YAVETH','oscarguidorosales101@gmail.com','88173512','Manuel Mora','2026-11-05 10:49:33'),(12,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793897374857@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 10:49:34'),(14,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793897395164@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 10:49:55'),(16,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793897422560@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 10:50:22'),(18,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793901400735@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 11:56:40'),(19,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793901496415@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 11:58:16'),(21,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793901632619@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 12:00:32'),(23,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793901728069@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 12:02:08'),(25,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793905918481@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 13:11:58'),(27,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793905981274@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 13:13:01'),(29,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793906246911@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 13:17:27'),(31,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793906282350@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 13:18:02'),(33,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793906334500@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 13:18:54'),(41,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793908069072@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 13:47:49'),(43,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793908273943@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 13:51:14'),(47,'empresa','Cliente Automatizado S.A.','nuevo_cliente_1793910508870@empresa.com','+57 3001234567','Av. Las Palmas # 20','2026-11-05 14:28:28');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_eventos`
--

DROP TABLE IF EXISTS `detalle_eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_eventos` (
  `id_detalle` int NOT NULL AUTO_INCREMENT,
  `id_evento` int NOT NULL,
  `id_servicio` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `idx_detalle_evento` (`id_evento`),
  KEY `idx_detalle_servicio` (`id_servicio`),
  CONSTRAINT `fk_detalle_evento` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `detalle_eventos_chk_1` CHECK ((`cantidad` > 0)),
  CONSTRAINT `detalle_eventos_chk_2` CHECK ((`precio_unitario` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_eventos`
--

LOCK TABLES `detalle_eventos` WRITE;
/*!40000 ALTER TABLE `detalle_eventos` DISABLE KEYS */;
INSERT INTO `detalle_eventos` VALUES (1,1,6,1,2800.00),(2,1,2,2,1800.00),(3,1,4,1,950.00),(4,2,1,1,3500.00),(5,2,5,1,1500.00),(14,10,1,1,3500.00),(15,11,1,1,3500.00),(16,11,2,1,1800.00),(17,11,3,1,1200.00),(18,11,6,1,2800.00),(19,11,5,1,1500.00),(20,11,4,1,950.00),(21,11,6,2,2800.00),(22,11,1,1,3500.00);
/*!40000 ALTER TABLE `detalle_eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventos`
--

DROP TABLE IF EXISTS `eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos` (
  `id_evento` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_evento` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_evento` date NOT NULL,
  `ubicacion` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('pendiente','confirmado','completado','cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`id_evento`),
  KEY `idx_eventos_cliente` (`id_cliente`),
  KEY `idx_eventos_estado` (`estado`),
  KEY `idx_eventos_fecha` (`fecha_evento`),
  CONSTRAINT `fk_eventos_clientes` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos`
--

LOCK TABLES `eventos` WRITE;
/*!40000 ALTER TABLE `eventos` DISABLE KEYS */;
INSERT INTO `eventos` VALUES (1,1,'Convención Anual Innova Tech 2026','Corporativo','2026-12-15','Salón Bellavista Modificado E2E','confirmado'),(2,2,'Boda Real Carolina y Fernando','Boda','2026-11-28','Hacienda El Paraíso, La Calera','confirmado'),(10,1,'Oscar Yabeth Guido Rosales','Boda','2026-11-13','Manuel Mora','confirmado'),(11,11,'Boda de amor con Wayner y Sofia','Boda','2026-11-21','Manuel Mora','confirmado'),(13,1,'Gala Corporativa Anual Nexo 2026','Corporativo','2026-11-20','Gran Salón Real Diamante','confirmado'),(39,33,'Gala de Tecnología E2E','Boda','2026-11-05','Salón Bellavista E2E','pendiente'),(40,33,'Gala de Tecnología E2E','Boda','2026-11-05','Salón Bellavista E2E','pendiente'),(41,33,'Gala de Tecnología E2E','Boda','2026-11-05','Salón Bellavista E2E','pendiente'),(42,33,'Gala de Tecnología E2E','Boda','2026-11-05','Salón Bellavista E2E','pendiente'),(51,43,'Gala de Tecnología E2E','Boda','2026-11-05','Salón Bellavista E2E','pendiente'),(52,43,'Gala de Tecnología E2E','Boda','2026-11-05','Salón Bellavista E2E','pendiente'),(69,47,'Gala de Tecnología E2E','Boda','2026-11-06','Salón Bellavista E2E','pendiente');
/*!40000 ALTER TABLE `eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'administrador','Control completo del sistema.'),(2,'supervisor','Supervisor de logística y cronogramas operativos'),(3,'cliente','Acceso limitado a información propia.');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `executed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES (1,'001_create_roles.sql','2026-11-05 09:22:01'),(2,'002_create_clientes.sql','2026-11-05 09:22:01'),(3,'003_create_servicios.sql','2026-11-05 09:22:02'),(4,'004_create_eventos.sql','2026-11-05 09:22:02'),(5,'005_create_detalle_eventos.sql','2026-11-05 09:22:02'),(6,'006_create_usuarios.sql','2026-11-05 09:22:02'),(7,'007_seed_roles.sql','2026-11-05 09:22:02'),(8,'008_seed_initial_data.sql','2026-11-05 09:22:02'),(9,'009_create_calendar_tables.sql','2026-11-05 10:31:17'),(10,'010_seed_calendar_categories.sql','2026-11-05 10:31:17'),(11,'011_seed_initial_schedules.sql','2026-11-05 10:31:17'),(12,'012_prevent_duplicate_event_schedules.sql','2026-11-05 13:05:36');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `id_servicio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `precio` decimal(10,2) NOT NULL,
  `estado` enum('activo','inactivo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_servicio`),
  KEY `idx_servicios_estado` (`estado`),
  CONSTRAINT `servicios_chk_1` CHECK ((`precio` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios`
--

LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
INSERT INTO `servicios` VALUES (1,'Organización Integral de Bodas','Planificación completa, coordinación de proveedores y logística del día de bodas.',3500.00,'activo'),(2,'Catering Premium Gourmet','Menú de 3 tiempos con maridaje, bocadillos de bienvenida y atención personalizada.',1800.00,'activo'),(3,'Fotografía y Video Cinematográfico','Cobertura audiovisual 4K con drones y edición profesional documental.',1200.00,'activo'),(4,'Sonido, Iluminación y Efectos Especiales','Sistema de sonido lineal, iluminación robótica DMX y efectos de niebla.',950.00,'activo'),(5,'Decoración Temática y Arreglos Florales','Diseño de ambientación personalizada, arcos florales y centros de mesa de lujo.',1500.00,'activo'),(6,'Producción de Eventos Corporativos','Montaje para congresos, lanzamientos de marca, pantallas LED y streaming.',2800.00,'activo'),(7,'Animación y Show en Vivo (Exclusivo)','Show musical temático y DJ profesional por 5 horas.',800.00,'inactivo');
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `id_rol` int NOT NULL,
  `id_cliente` int DEFAULT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo` (`correo`),
  UNIQUE KEY `id_cliente` (`id_cliente`),
  KEY `idx_usuarios_rol` (`id_rol`),
  KEY `idx_usuarios_cliente` (`id_cliente`),
  KEY `idx_usuarios_correo` (`correo`),
  CONSTRAINT `fk_usuarios_clientes` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,NULL,'Administrador Oscar','admin@nexoeventos.com','$2a$10$tYV6SGNA9YAJ6zOvJCPl4.hajE4Ke0Bfr2oYSliz3ty2fuyPN2lvS','2026-11-05 09:22:02'),(2,2,NULL,'Supervisor de Operaciones Steven','supervisor@nexoeventos.com','$2a$10$wvKQmwmVA5NFNZGjPk1ynON6YvY1AMU5buS9ZHXhRbMatZMQDNwaC','2026-11-05 09:22:02'),(3,3,1,'Innova Tech - Gestor Eventos','cliente@empresa.com','$2a$10$jlPpNCyNmpr1tnIRsP35/OE8Ge9GDG5guAD/kKRDDCLGRsja7JCxK','2026-11-05 09:22:02'),(4,3,3,'Cliente Automatizado S.A.','nuevo_cliente_1793892618779@empresa.com','$2a$10$eYE61Ttcx08gDMSynhG3EuqUStnfh9muAL1RuE.qE.im04.gqg52S','2026-11-05 09:30:18'),(6,3,5,'Cliente Automatizado S.A.','nuevo_cliente_1793893413846@empresa.com','$2a$10$tclfEkV6tdYKgHMDM85CgOiJji3d0yemXwG.tPfiwusAN/sGPiPPW','2026-11-05 09:43:34'),(8,3,7,'Cliente Automatizado S.A.','nuevo_cliente_1793897022084@empresa.com','$2a$10$I.CtH99Whp0iZ9tMiNhuCeM6r49unZgeyJstpIIz4u20NdjkQfSma','2026-11-05 10:43:42'),(10,3,9,'Cliente Automatizado S.A.','nuevo_cliente_1793897238976@empresa.com','$2a$10$pN3qxzdN7SNCbRDaWFOCpeR0O93.ooH2Mok9Lm80TPO6RKUNsFuwa','2026-11-05 10:47:19'),(12,3,11,'OSCAR YAVETH','oscarguidorosales101@gmail.com','$2a$10$LQC3bxyiV5m3BkwoSxb1UO4adPP.8nBrtjZczkgkTgqlocjp7TjYi','2026-11-05 10:49:33'),(13,3,12,'Cliente Automatizado S.A.','nuevo_cliente_1793897374857@empresa.com','$2a$10$YSsoxlkilY.glQfZ2OsJbelp97QVB84YS6iIp3KqmvJRYplgg1OKa','2026-11-05 10:49:34'),(15,3,14,'Cliente Automatizado S.A.','nuevo_cliente_1793897395164@empresa.com','$2a$10$kNUC20Mh9kf3Mah6xx8//.osChTjbYKjVhjEmm0rmGY5PGMU5iG5q','2026-11-05 10:49:55'),(17,3,16,'Cliente Automatizado S.A.','nuevo_cliente_1793897422560@empresa.com','$2a$10$FLg3JknKN7.7/z2Qj0tkVeVjVGtkdBpy7iz9qAAo8eRPw1q92NCMK','2026-11-05 10:50:22'),(19,3,18,'Cliente Automatizado S.A.','nuevo_cliente_1793901400735@empresa.com','$2a$10$YAahBXUOL89S51ZgRAGP5ezuXhIiJW8rTUc.g95sUEwgjvXqYt4PK','2026-11-05 11:56:40'),(20,3,19,'Cliente Automatizado S.A.','nuevo_cliente_1793901496415@empresa.com','$2a$10$IlwDFwn771wmJBSkNpEYp.WdkuKMq.yaXSJzCd0TspMIUGagGYUa2','2026-11-05 11:58:16'),(22,3,21,'Cliente Automatizado S.A.','nuevo_cliente_1793901632619@empresa.com','$2a$10$x4vG8ivHT34OOewb.yOiB.OhU2bOjPVpu7FirTQU02MZ7PjLiOFb2','2026-11-05 12:00:32'),(24,3,23,'Cliente Automatizado S.A.','nuevo_cliente_1793901728069@empresa.com','$2a$10$/ud0dSvbefEW06dzoy85QuNS386T6Dmp2z8yJ2d1dYpiL3/aMMDte','2026-11-05 12:02:08'),(26,3,25,'Cliente Automatizado S.A.','nuevo_cliente_1793905918481@empresa.com','$2a$10$.XBbzTbNOrTwTVh1bsU7l.tN/r5nwvB1RaIbZo8dGsv09CXD3HhXa','2026-11-05 13:11:58'),(28,3,27,'Cliente Automatizado S.A.','nuevo_cliente_1793905981274@empresa.com','$2a$10$mc/pjJGJ77iS0yFY1yktveK5Tyt7/Nsl0nFfMAqDfpKj4ggacaTsW','2026-11-05 13:13:01'),(30,3,29,'Cliente Automatizado S.A.','nuevo_cliente_1793906246911@empresa.com','$2a$10$GPAIUW/vaKI9HFe00ZSloOB14EEQJlnmCKuUhKe/rRfGdOaApbtha','2026-11-05 13:17:27'),(32,3,31,'Cliente Automatizado S.A.','nuevo_cliente_1793906282350@empresa.com','$2a$10$7wlzjpOZJRAtDogqt01RruB9pvLOdknVueIHOlH6fCyYL8XXucuwW','2026-11-05 13:18:02'),(34,3,33,'Cliente Automatizado S.A.','nuevo_cliente_1793906334500@empresa.com','$2a$10$Wjyhz1Mls1fffAqoKKZKgu3ycjJUIN/Xxsnii/uekOgwPVjiNoUD6','2026-11-05 13:18:54'),(41,3,41,'Cliente Automatizado S.A.','nuevo_cliente_1793908069072@empresa.com','$2a$10$cmQsJL6p3jO8UPFDnjpd3.ozJirYzCcd/LkB.I3tzX6L8WY7VDv36','2026-11-05 13:47:49'),(43,3,43,'Cliente Automatizado S.A.','nuevo_cliente_1793908273943@empresa.com','$2a$10$I2ANLrwFqCuM4RNk5fgwi.OiFZu/XbRH4gIQe.OZAHNFYGtuRxMti','2026-11-05 13:51:14'),(49,3,47,'Cliente Automatizado S.A.','nuevo_cliente_1793910508870@empresa.com','$2a$10$1KQnAD49R6Xso0YFdIc87O4iNDOvCbZHB0KI26q/Wnh1SO7B37uUK','2026-11-05 14:28:28');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'nexoeventos'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-05 18:42:59

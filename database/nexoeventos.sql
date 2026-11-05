-- =============================================================================
-- BASE DE DATOS: nexoeventos
-- MOTOR: MySQL 8.0 | CHARSET: utf8mb4 | COLLATION: utf8mb4_unicode_ci
-- SISTEMA INTEGRAL DE GESTIÓN DE EVENTOS - NEXOEVENTOS
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `nexoeventos`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `nexoeventos`;

-- Desactivar temporalmente verificación de claves foráneas para importación limpia
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. TABLA: roles
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id_rol` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(40) NOT NULL UNIQUE,
  `descripcion` VARCHAR(200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: clientes
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id_cliente` INT AUTO_INCREMENT PRIMARY KEY,
  `tipo_cliente` ENUM('persona', 'empresa') NOT NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `correo` VARCHAR(120),
  `telefono` VARCHAR(20),
  `direccion` VARCHAR(200),
  `fecha_registro` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_clientes_tipo` (`tipo_cliente`),
  INDEX `idx_clientes_correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: servicios
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `servicios`;
CREATE TABLE `servicios` (
  `id_servicio` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(120) NOT NULL,
  `descripcion` TEXT,
  `precio` DECIMAL(10,2) NOT NULL CHECK (`precio` >= 0),
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  INDEX `idx_servicios_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: eventos
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `eventos`;
CREATE TABLE `eventos` (
  `id_evento` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cliente` INT NOT NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `tipo_evento` VARCHAR(50) NOT NULL,
  `fecha_evento` DATE NOT NULL,
  `ubicacion` VARCHAR(200) NOT NULL,
  `estado` ENUM('pendiente', 'confirmado', 'completado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  INDEX `idx_eventos_cliente` (`id_cliente`),
  INDEX `idx_eventos_estado` (`estado`),
  INDEX `idx_eventos_fecha` (`fecha_evento`),
  CONSTRAINT `fk_eventos_clientes` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: detalle_eventos
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `detalle_eventos`;
CREATE TABLE `detalle_eventos` (
  `id_detalle` INT AUTO_INCREMENT PRIMARY KEY,
  `id_evento` INT NOT NULL,
  `id_servicio` INT NOT NULL,
  `cantidad` INT NOT NULL CHECK (`cantidad` > 0),
  `precio_unitario` DECIMAL(10,2) NOT NULL CHECK (`precio_unitario` >= 0),
  INDEX `idx_detalle_evento` (`id_evento`),
  INDEX `idx_detalle_servicio` (`id_servicio`),
  CONSTRAINT `fk_detalle_evento` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_detalle_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: usuarios
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
  `id_rol` INT NOT NULL,
  `id_cliente` INT NULL UNIQUE,
  `nombre` VARCHAR(120) NOT NULL,
  `correo` VARCHAR(120) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_usuarios_rol` (`id_rol`),
  INDEX `idx_usuarios_cliente` (`id_cliente`),
  INDEX `idx_usuarios_correo` (`correo`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_usuarios_clientes` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. TABLA DE CONTROL DE MIGRACIONES: schema_migrations
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `schema_migrations`;
CREATE TABLE `schema_migrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `migration_name` VARCHAR(255) NOT NULL UNIQUE,
  `executed_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- INSERCIÓN DE DATOS INICIALES (SEEDS)
-- =============================================================================

-- Roles protegidos del sistema
INSERT INTO `roles` (`id_rol`, `nombre`, `descripcion`) VALUES
  (1, 'administrador', 'Control completo del sistema.'),
  (2, 'supervisor', 'Gestión y supervisión de operaciones.'),
  (3, 'cliente', 'Acceso limitado a información propia.')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

-- Clientes iniciales
INSERT INTO `clientes` (`id_cliente`, `tipo_cliente`, `nombre`, `correo`, `telefono`, `direccion`) VALUES
  (1, 'empresa', 'Corporación Innova Tech S.A.S.', 'contacto@innovatech.com', '+57 3105551234', 'Calle 100 # 15-20, Bogotá'),
  (2, 'persona', 'Carolina Mendoza Ruiz', 'carolina.mendoza@email.com', '+57 3208889900', 'Carrera 7 # 45-12, Medellín')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Usuarios iniciales (Contraseñas con bcrypt salt=10: Admin1234*, Supervisor1234*, Cliente1234*)
INSERT INTO `usuarios` (`id_usuario`, `id_rol`, `id_cliente`, `nombre`, `correo`, `password`) VALUES
  (1, 1, NULL, 'Administrador NexoEventos', 'admin@nexoeventos.com', '$2a$10$3FHTBbU/pzIdo7jesjvSdOIWqgz21Grv156eMpdzQM8OzH.o8/dNm'),
  (2, 2, NULL, 'Supervisor de Operaciones', 'supervisor@nexoeventos.com', '$2a$10$wvKQmwmVA5NFNZGjPk1ynON6YvY1AMU5buS9ZHXhRbMatZMQDNwaC'),
  (3, 3, 1, 'Innova Tech - Gestor Eventos', 'cliente@empresa.com', '$2a$10$jlPpNCyNmpr1tnIRsP35/OE8Ge9GDG5guAD/kKRDDCLGRsja7JCxK')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Servicios ofrecidos
INSERT INTO `servicios` (`id_servicio`, `nombre`, `descripcion`, `precio`, `estado`) VALUES
  (1, 'Organización Integral de Bodas', 'Planificación completa, coordinación de proveedores y logística del día de bodas.', 3500.00, 'activo'),
  (2, 'Catering Premium Gourmet', 'Menú de 3 tiempos con maridaje, bocadillos de bienvenida y atención personalizada.', 1800.00, 'activo'),
  (3, 'Fotografía y Video Cinematográfico', 'Cobertura audiovisual 4K con drones y edición profesional documental.', 1200.00, 'activo'),
  (4, 'Sonido, Iluminación y Efectos Especiales', 'Sistema de sonido lineal, iluminación robótica DMX y efectos de niebla.', 950.00, 'activo'),
  (5, 'Decoración Temática y Arreglos Florales', 'Diseño de ambientación personalizada, arcos florales y centros de mesa de lujo.', 1500.00, 'activo'),
  (6, 'Producción de Eventos Corporativos', 'Montaje para congresos, lanzamientos de marca, pantallas LED y streaming.', 2800.00, 'activo'),
  (7, 'Animación y Show en Vivo (Exclusivo)', 'Show musical temático y DJ profesional por 5 horas.', 800.00, 'inactivo')
ON DUPLICATE KEY UPDATE `precio` = VALUES(`precio`);

-- Eventos de muestra
INSERT INTO `eventos` (`id_evento`, `id_cliente`, `nombre`, `tipo_evento`, `fecha_evento`, `ubicacion`, `estado`) VALUES
  (1, 1, 'Convención Anual Innova Tech 2026', 'Corporativo', '2026-12-15', 'Centro de Convenciones Ágora - Salón Gran Diamante', 'confirmado'),
  (2, 2, 'Boda Real Carolina y Fernando', 'Boda', '2026-11-28', 'Hacienda El Paraíso, La Calera', 'pendiente')
ON DUPLICATE KEY UPDATE `estado` = VALUES(`estado`);

-- Detalle de eventos (relación muchos a muchos con precio unitario congelado)
INSERT INTO `detalle_eventos` (`id_detalle`, `id_evento`, `id_servicio`, `cantidad`, `precio_unitario`) VALUES
  (1, 1, 6, 1, 2800.00),
  (2, 1, 2, 2, 1800.00),
  (3, 1, 4, 1, 950.00),
  (4, 2, 1, 1, 3500.00),
  (5, 2, 5, 1, 1500.00)
ON DUPLICATE KEY UPDATE `cantidad` = VALUES(`cantidad`);


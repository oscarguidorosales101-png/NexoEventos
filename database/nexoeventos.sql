-- =============================================================================
-- BASE DE DATOS: nexoeventos
-- MOTOR: MySQL 8.0 | CHARSET: utf8mb4 | COLLATION: utf8mb4_unicode_ci
-- SISTEMA INTEGRAL DE GESTIÓN DE EVENTOS Y AGENDAS - NEXOEVENTOS
-- TIMEZONE DE LA APLICACIÓN: America/Costa_Rica
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
-- 7. TABLA: categorias_agenda (Extensión Calendario)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `categorias_agenda`;
CREATE TABLE `categorias_agenda` (
  `id_categoria` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(60) NOT NULL UNIQUE,
  `color` VARCHAR(20) NOT NULL,
  `descripcion` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. TABLA: agendas (Extensión Calendario)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `agendas`;
CREATE TABLE `agendas` (
  `id_agenda` INT AUTO_INCREMENT PRIMARY KEY,
  `id_categoria` INT NOT NULL,
  `id_evento` INT NULL,
  `id_responsable` INT NOT NULL,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `fecha_inicio` DATETIME NOT NULL,
  `fecha_fin` DATETIME NOT NULL,
  `ubicacion` VARCHAR(200) NOT NULL,
  `imagen_portada` VARCHAR(255) NULL,
  `estado` VARCHAR(30) NOT NULL DEFAULT 'programada',
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_agendas_categoria` (`id_categoria`),
  INDEX `idx_agendas_evento` (`id_evento`),
  INDEX `idx_agendas_responsable` (`id_responsable`),
  INDEX `idx_agendas_rango_fechas` (`fecha_inicio`, `fecha_fin`),
  INDEX `idx_agendas_estado` (`estado`),
  CONSTRAINT `fk_agendas_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_agenda` (`id_categoria`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_agendas_evento` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_agendas_responsable` FOREIGN KEY (`id_responsable`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. TABLA: agenda_integrantes (Extensión Calendario)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `agenda_integrantes`;
CREATE TABLE `agenda_integrantes` (
  `id_agenda` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `fecha_asignacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_agenda`, `id_usuario`),
  INDEX `idx_integrantes_usuario` (`id_usuario`),
  CONSTRAINT `fk_integrantes_agenda` FOREIGN KEY (`id_agenda`) REFERENCES `agendas` (`id_agenda`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_integrantes_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. TABLA: agenda_notas (Extensión Calendario)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `agenda_notas`;
CREATE TABLE `agenda_notas` (
  `id_nota` INT AUTO_INCREMENT PRIMARY KEY,
  `id_agenda` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `descripcion` TEXT NOT NULL,
  `completada` BOOLEAN NOT NULL DEFAULT FALSE,
  `fecha_limite` DATETIME NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notas_agenda` (`id_agenda`),
  INDEX `idx_notas_usuario` (`id_usuario`),
  CONSTRAINT `fk_notas_agenda` FOREIGN KEY (`id_agenda`) REFERENCES `agendas` (`id_agenda`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_notas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. TABLA DE CONTROL DE MIGRACIONES: schema_migrations
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

-- Detalle de eventos
INSERT INTO `detalle_eventos` (`id_detalle`, `id_evento`, `id_servicio`, `cantidad`, `precio_unitario`) VALUES
  (1, 1, 6, 1, 2800.00),
  (2, 1, 2, 2, 1800.00),
  (3, 1, 4, 1, 950.00),
  (4, 2, 1, 1, 3500.00),
  (5, 2, 5, 1, 1500.00)
ON DUPLICATE KEY UPDATE `cantidad` = VALUES(`cantidad`);

-- Categorías de Calendario
INSERT INTO `categorias_agenda` (`id_categoria`, `nombre`, `color`, `descripcion`) VALUES
  (1, 'Event', '#D4AF37', 'Eventos principales y ceremonias contratadas.'),
  (2, 'Meeting', '#3B82F6', 'Reuniones de coordinación y comités con clientes o proveedores.'),
  (3, 'Setup and Rehearsal', '#F59E0B', 'Montajes técnicos, ensayos generales y pruebas de sonido e iluminación.'),
  (4, 'Task Deadlines', '#EC4899', 'Hitos clave y fechas límite de entregas operativas.')
ON DUPLICATE KEY UPDATE `color` = VALUES(`color`), `descripcion` = VALUES(`descripcion`);

-- Agendas iniciales
INSERT INTO `agendas` (`id_agenda`, `id_categoria`, `id_evento`, `id_responsable`, `titulo`, `descripcion`, `fecha_inicio`, `fecha_fin`, `ubicacion`, `estado`) VALUES
  (1, 2, 2, 2, 'Reunión Preliminar con Proveedores de Sonido', 'Inspección técnica de acometidas eléctricas y acústica del salón principal.', '2026-11-03 15:00:00', '2026-11-03 16:30:00', 'Hacienda El Paraíso, La Calera', 'completada'),
  (2, 2, 1, 2, 'Alineación de Logística y Banquete Corporativo', 'Revisión final de tiempos de servicio, opciones de menú y asignación de mesas.', '2026-11-04 10:00:00', '2026-11-04 11:30:00', 'Sala de Juntas NexoEventos', 'completada'),
  (3, 3, 1, 2, 'Montaje Técnico y Prueba de Iluminación DMX', 'Calibración de robóticas, pantallas LED y chequeo de sonido lineal.', '2026-11-05 14:00:00', '2026-11-05 17:00:00', 'Centro de Convenciones Ágora - Gran Diamante', 'en_progreso'),
  (4, 4, 1, 1, 'Cierre de Confirmaciones y Entrega de Escarapelas', 'Fecha límite para emisión de códigos QR y entrega de material a comité anfitrión.', '2026-11-06 09:00:00', '2026-11-06 12:00:00', 'Sede Administrativa NexoEventos', 'programada'),
  (5, 1, 2, 1, 'Boda Real Carolina y Fernando — Ceremonia y Recepción', 'Planificación integral y coordinación en vivo de la boda, banquete y show musical.', '2026-11-07 16:00:00', '2026-11-07 23:00:00', 'Hacienda El Paraíso, La Calera', 'programada')
ON DUPLICATE KEY UPDATE `titulo` = VALUES(`titulo`);

-- Integrantes de Agendas
INSERT INTO `agenda_integrantes` (`id_agenda`, `id_usuario`) VALUES
  (1, 2),
  (2, 2),
  (2, 1),
  (3, 2),
  (3, 1),
  (4, 1),
  (5, 1),
  (5, 2)
ON DUPLICATE KEY UPDATE `fecha_asignacion` = VALUES(`fecha_asignacion`);

-- Notas operativas
INSERT INTO `agenda_notas` (`id_nota`, `id_agenda`, `id_usuario`, `descripcion`, `completada`, `fecha_limite`) VALUES
  (1, 1, 2, 'Medir voltaje disponible en la zona del jardín para el generador de respaldo.', TRUE, '2026-11-03 14:00:00'),
  (2, 2, 2, 'Confirmar alternativas de menú para 12 asistentes con dieta vegetariana y celíaca.', TRUE, '2026-11-04 09:30:00'),
  (3, 3, 2, 'Verificar que las consolas DMX reconozcan las cabezas móviles nuevas.', FALSE, '2026-11-05 16:00:00'),
  (4, 4, 1, 'Imprimir 250 credenciales plastificadas con cordón dorado institucional.', FALSE, '2026-11-06 11:00:00'),
  (5, 5, 1, 'Coordinar la llegada de los floristas para armado de arco nupcial a las 13:00.', FALSE, '2026-11-07 13:00:00'),
  (6, 5, 2, 'Comprobar microfonía inalámbrica de votos matrimoniales.', FALSE, '2026-11-07 15:30:00')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

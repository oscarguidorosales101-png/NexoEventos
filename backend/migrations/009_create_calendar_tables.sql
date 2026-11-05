-- =============================================================================
-- MIGRACIÓN 009: CREACIÓN DE TABLAS DE EXTENSIÓN PARA CALENDARIO Y AGENDAS
-- Timezone estándar: America/Costa_Rica
-- =============================================================================

-- 1. Catálogo fijo de categorías de agenda
CREATE TABLE IF NOT EXISTS categorias_agenda (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  color VARCHAR(20) NOT NULL,
  descripcion VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla principal de agendas y citas de calendario
CREATE TABLE IF NOT EXISTS agendas (
  id_agenda INT AUTO_INCREMENT PRIMARY KEY,
  id_categoria INT NOT NULL,
  id_evento INT NULL,
  id_responsable INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME NOT NULL,
  ubicacion VARCHAR(200) NOT NULL,
  imagen_portada VARCHAR(255) NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'programada',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agendas_categoria (id_categoria),
  INDEX idx_agendas_evento (id_evento),
  INDEX idx_agendas_responsable (id_responsable),
  INDEX idx_agendas_rango_fechas (fecha_inicio, fecha_fin),
  INDEX idx_agendas_estado (estado),
  CONSTRAINT fk_agendas_categoria FOREIGN KEY (id_categoria) REFERENCES categorias_agenda(id_categoria) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_agendas_evento FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_agendas_responsable FOREIGN KEY (id_responsable) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla asociativa de integrantes del equipo asignados a la agenda
CREATE TABLE IF NOT EXISTS agenda_integrantes (
  id_agenda INT NOT NULL,
  id_usuario INT NOT NULL,
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_agenda, id_usuario),
  INDEX idx_integrantes_usuario (id_usuario),
  CONSTRAINT fk_integrantes_agenda FOREIGN KEY (id_agenda) REFERENCES agendas(id_agenda) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_integrantes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Notas operativas y checklist de tareas por agenda
CREATE TABLE IF NOT EXISTS agenda_notas (
  id_nota INT AUTO_INCREMENT PRIMARY KEY,
  id_agenda INT NOT NULL,
  id_usuario INT NOT NULL,
  descripcion TEXT NOT NULL,
  completada BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_limite DATETIME NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notas_agenda (id_agenda),
  INDEX idx_notas_usuario (id_usuario),
  CONSTRAINT fk_notas_agenda FOREIGN KEY (id_agenda) REFERENCES agendas(id_agenda) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS eventos (
  id_evento INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  tipo_evento VARCHAR(50) NOT NULL,
  fecha_evento DATE NOT NULL,
  ubicacion VARCHAR(200) NOT NULL,
  estado ENUM('pendiente', 'confirmado', 'completado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  INDEX idx_eventos_cliente (id_cliente),
  INDEX idx_eventos_estado (estado),
  INDEX idx_eventos_fecha (fecha_evento),
  CONSTRAINT fk_eventos_clientes FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


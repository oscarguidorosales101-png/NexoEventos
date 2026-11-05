CREATE TABLE IF NOT EXISTS detalle_eventos (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_evento INT NOT NULL,
  id_servicio INT NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  INDEX idx_detalle_evento (id_evento),
  INDEX idx_detalle_servicio (id_servicio),
  CONSTRAINT fk_detalle_evento FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_servicio FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


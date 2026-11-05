CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  tipo_cliente ENUM('persona', 'empresa') NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(120),
  telefono VARCHAR(20),
  direccion VARCHAR(200),
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_clientes_tipo (tipo_cliente),
  INDEX idx_clientes_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


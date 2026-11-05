INSERT INTO roles (id_rol, nombre, descripcion) VALUES
  (1, 'administrador', 'Control completo del sistema.'),
  (2, 'supervisor', 'Gestión y supervisión de operaciones.'),
  (3, 'cliente', 'Acceso limitado a información propia.')
ON DUPLICATE KEY UPDATE 
  nombre = VALUES(nombre),
  descripcion = VALUES(descripcion);


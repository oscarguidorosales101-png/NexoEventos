-- 1. Clientes Iniciales
INSERT INTO clientes (id_cliente, tipo_cliente, nombre, correo, telefono, direccion) VALUES
  (1, 'empresa', 'Corporación Innova Tech S.A.S.', 'contacto@innovatech.com', '+57 3105551234', 'Calle 100 # 15-20, Bogotá'),
  (2, 'persona', 'Carolina Mendoza Ruiz', 'carolina.mendoza@email.com', '+57 3208889900', 'Carrera 7 # 45-12, Medellín')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- 2. Usuarios Iniciales (Admin, Supervisor y Cliente asociado)
INSERT INTO usuarios (id_usuario, id_rol, id_cliente, nombre, correo, password) VALUES
  (1, 1, NULL, 'Administrador NexoEventos', 'admin@nexoeventos.com', '$2a$10$/a75nv2vtgH24dvWDwZMnO5eZ4olK19YBpfrtv14h02TjOd4PQwUu'),
  (2, 2, NULL, 'Supervisor de Operaciones', 'supervisor@nexoeventos.com', '$2a$10$wvKQmwmVA5NFNZGjPk1ynON6YvY1AMU5buS9ZHXhRbMatZMQDNwaC'),
  (3, 3, 1, 'Innova Tech - Gestor Eventos', 'cliente@empresa.com', '$2a$10$jlPpNCyNmpr1tnIRsP35/OE8Ge9GDG5guAD/kKRDDCLGRsja7JCxK')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- 3. Servicios Iniciales
INSERT INTO servicios (id_servicio, nombre, descripcion, precio, estado) VALUES
  (1, 'Organización Integral de Bodas', 'Planificación completa, coordinación de proveedores y logística del día de bodas.', 3500.00, 'activo'),
  (2, 'Catering Premium Gourmet', 'Menú de 3 tiempos con maridaje, bocadillos de bienvenida y atención personalizada.', 1800.00, 'activo'),
  (3, 'Fotografía y Video Cinematográfico', 'Cobertura audiovisual 4K con drones y edición profesional documental.', 1200.00, 'activo'),
  (4, 'Sonido, Iluminación y Efectos Especiales', 'Sistema de sonido lineal, iluminación robótica DMX y efectos de niebla.', 950.00, 'activo'),
  (5, 'Decoración Temática y Arreglos Florales', 'Diseño de ambientación personalizada, arcos florales y centros de mesa de lujo.', 1500.00, 'activo'),
  (6, 'Producción de Eventos Corporativos', 'Montaje para congresos, lanzamientos de marca, pantallas LED y streaming.', 2800.00, 'activo'),
  (7, 'Animación y Show en Vivo (Exclusivo)', 'Show musical temático y DJ profesional por 5 horas.', 800.00, 'inactivo')
ON DUPLICATE KEY UPDATE precio = VALUES(precio);

-- 4. Eventos Iniciales
INSERT INTO eventos (id_evento, id_cliente, nombre, tipo_evento, fecha_evento, ubicacion, estado) VALUES
  (1, 1, 'Convención Anual Innova Tech 2026', 'Corporativo', '2026-12-15', 'Centro de Convenciones Ágora - Salón Gran Diamante', 'confirmado'),
  (2, 2, 'Boda Real Carolina y Fernando', 'Boda', '2026-11-28', 'Hacienda El Paraíso, La Calera', 'pendiente')
ON DUPLICATE KEY UPDATE estado = VALUES(estado);

-- 5. Detalle de Eventos Iniciales
INSERT INTO detalle_eventos (id_detalle, id_evento, id_servicio, cantidad, precio_unitario) VALUES
  (1, 1, 6, 1, 2800.00),
  (2, 1, 2, 2, 1800.00),
  (3, 1, 4, 1, 950.00),
  (4, 2, 1, 1, 3500.00),
  (5, 2, 5, 1, 1500.00)
ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad);


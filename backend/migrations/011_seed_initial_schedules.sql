-- =============================================================================
-- MIGRACIÓN 011: AGENDAS INICIALES PARA EL CALENDARIO OPERATIVO
-- =============================================================================

INSERT INTO agendas (id_agenda, id_categoria, id_evento, id_responsable, titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, estado) VALUES
  (1, 2, 2, 2, 'Reunión Preliminar con Proveedores de Sonido', 'Inspección técnica de acometidas eléctricas y acústica del salón principal.', '2026-11-03 15:00:00', '2026-11-03 16:30:00', 'Hacienda El Paraíso, La Calera', 'completada'),
  (2, 2, 1, 2, 'Alineación de Logística y Banquete Corporativo', 'Revisión final de tiempos de servicio, opciones de menú y asignación de mesas.', '2026-11-04 10:00:00', '2026-11-04 11:30:00', 'Sala de Juntas NexoEventos', 'completada'),
  (3, 3, 1, 2, 'Montaje Técnico y Prueba de Iluminación DMX', 'Calibración de robóticas, pantallas LED y chequeo de sonido lineal.', '2026-11-05 14:00:00', '2026-11-05 17:00:00', 'Centro de Convenciones Ágora - Gran Diamante', 'en_progreso'),
  (4, 4, 1, 1, 'Cierre de Confirmaciones y Entrega de Escarapelas', 'Fecha límite para emisión de códigos QR y entrega de material a comité anfitrión.', '2026-11-06 09:00:00', '2026-11-06 12:00:00', 'Sede Administrativa NexoEventos', 'programada'),
  (5, 1, 2, 1, 'Boda Real Carolina y Fernando — Ceremonia y Recepción', 'Planificación integral y coordinación en vivo de la boda, banquete y show musical.', '2026-11-07 16:00:00', '2026-11-07 23:00:00', 'Hacienda El Paraíso, La Calera', 'programada')
ON DUPLICATE KEY UPDATE titulo = VALUES(titulo);

-- Integrantes asignados a cada agenda
INSERT INTO agenda_integrantes (id_agenda, id_usuario) VALUES
  (1, 2),
  (2, 2),
  (2, 1),
  (3, 2),
  (3, 1),
  (4, 1),
  (5, 1),
  (5, 2)
ON DUPLICATE KEY UPDATE fecha_asignacion = VALUES(fecha_asignacion);

-- Notas operativas asociadas
INSERT INTO agenda_notas (id_nota, id_agenda, id_usuario, descripcion, completada, fecha_limite) VALUES
  (1, 1, 2, 'Medir voltaje disponible en la zona del jardín para el generador de respaldo.', TRUE, '2026-11-03 14:00:00'),
  (2, 2, 2, 'Confirmar alternativas de menú para 12 asistentes con dieta vegetariana y celíaca.', TRUE, '2026-11-04 09:30:00'),
  (3, 3, 2, 'Verificar que las consolas DMX reconozcan las cabezas móviles nuevas.', FALSE, '2026-11-05 16:00:00'),
  (4, 4, 1, 'Imprimir 250 credenciales plastificadas con cordón dorado institucional.', FALSE, '2026-11-06 11:00:00'),
  (5, 5, 1, 'Coordinar la llegada de los floristas para armado de arco nupcial a las 13:00.', FALSE, '2026-11-07 13:00:00'),
  (6, 5, 2, 'Comprobar microfonía inalámbrica de votos matrimoniales.', FALSE, '2026-11-07 15:30:00')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);


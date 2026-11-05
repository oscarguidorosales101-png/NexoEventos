-- =============================================================================
-- MIGRACIÓN 010: CATÁLOGO DE LAS 4 CATEGORÍAS FIJAS DE CALENDARIO
-- =============================================================================

INSERT INTO categorias_agenda (id_categoria, nombre, color, descripcion) VALUES
  (1, 'Event', '#D4AF37', 'Eventos principales y ceremonias contratadas.'),
  (2, 'Meeting', '#3B82F6', 'Reuniones de coordinación y comités con clientes o proveedores.'),
  (3, 'Setup and Rehearsal', '#F59E0B', 'Montajes técnicos, ensayos generales y pruebas de sonido e iluminación.'),
  (4, 'Task Deadlines', '#EC4899', 'Hitos clave y fechas límite de entregas operativas.')
ON DUPLICATE KEY UPDATE
  color = VALUES(color),
  descripcion = VALUES(descripcion);


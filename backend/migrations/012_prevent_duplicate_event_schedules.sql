-- =============================================================================
-- MIGRACIÓN 012: PROTECCIÓN DE INTEGRIDAD PARA AGENDAS PRINCIPALES DE EVENTOS
-- Garantiza que un evento comercial no tenga más de una agenda principal (categoría Event),
-- permitiendo múltiples actividades operativas secundarias (reuniones, montajes, tareas).
-- Utiliza un índice funcional único nativo de MySQL 8.0.
-- =============================================================================

CREATE UNIQUE INDEX uq_evento_agenda_principal ON agendas (
  (CASE WHEN id_categoria = 1 AND id_evento IS NOT NULL THEN id_evento ELSE NULL END)
);

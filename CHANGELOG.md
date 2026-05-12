# Changelog

## Sprint 2 — Publicación y Respuesta

### US-04 · Publicación e Inmutabilidad
- Nuevo componente reutilizable `ConfirmModal` (`src/components/ConfirmModal.jsx`).
- En `CreateSurvey`, el botón **Publicar** abre un modal de advertencia:
  *"Una vez publicada, no podrás editar las preguntas"*. Al confirmar, crea la
  encuesta y la publica (`PATCH /surveys/{id}/publish`). El botón **Guardar
  borrador** ahora persiste la encuesta en estado borrador.
- Nuevos métodos en `src/lib/apiClient.js`: `listSurveys()` y `publishSurvey(id)`.

### US-02 · Panel: Gestión de Estados
- `Dashboard` ahora consume `GET /surveys` y lista las encuestas del usuario con
  etiquetas de estado claras (**Borrador / Activa / Cerrada**). Si está en
  borrador ofrece acceso directo a edición; si está activa o cerrada, acceso a
  resultados.

### US-07 · Llenado: UX de Scroll Continuo
- `SurveyAccess` muestra todas las preguntas en un único scroll vertical (sin
  wizard) y recibe la encuesta desde el servicio de validación de código
  (US-05). Soporta los 3 tipos de pregunta (abierta / test / sí-no).
- Ajustes mobile: botón de envío grande y fijo en la parte inferior, opciones
  con área táctil amplia.

### US-08 · Recolección: Confirmación de Envío
- Al presionar **Enviar respuestas** aparece un modal de confirmación:
  *"¿Deseas enviar tus respuestas ahora?"*. Al confirmar se envían las respuestas
  y se muestra una pantalla de agradecimiento.
- Bloqueo post-envío con `LocalStorage` (clave única `fastforms:answered:<code>`).
  Si el usuario vuelve a entrar al link se muestra *"Ya has respondido esta
  encuesta"* sin volver a cargar el formulario.

### Tests
- `src/pages/SurveyAccess.test.jsx` actualizado: cubre el modal de confirmación
  y el bloqueo de reenvío por `LocalStorage`.

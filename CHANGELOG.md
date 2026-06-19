# Changelog

## Sprint 4 — Voz (Whisper)

### US-12 · Infra (frontend)
- Nuevo helper `transcribeAudio(blob, options)` en `src/lib/apiClient.js`
  que envía el audio al endpoint `POST /api/v1/transcribe/` y devuelve
  `{ text, language, confidence }`. Adjunta JWT si hay sesión; las
  requests anónimas también son aceptadas (necesario para US-14).

### US-13 · Constructor: Dictado de Preguntas
- Nuevo componente reutilizable `src/components/VoiceInput.jsx` con
  MediaRecorder, solicitud de permisos y los estados de US-16.
- En `Question.jsx`, cada campo de enunciado incluye un botón de
  micrófono. El texto transcrito se inserta en el `input` y queda
  editable antes de guardar.

### US-14 · Llenado: Respuesta por Voz en Preguntas Abiertas
- `SurveyQuestionField` (preguntas abiertas) ahora ofrece "Responder
  por voz": graba, transcribe, escribe la respuesta en el `textarea` y
  la deja editable. Funciona sin necesidad de cuenta.
- Degradación elegante: si la transcripción falla, el componente
  muestra el error y permite reintentar o escribir manualmente.

### US-15 · Accesibilidad: Selección por Voz
- Nueva utilidad `src/lib/fuzzyMatch.js` (Levenshtein normalizado +
  inclusión) que empareja la transcripción con la opción más parecida.
- En preguntas Sí/No y de Opción Múltiple, el botón de voz marca la
  opción automáticamente cuando la similitud supera
  `CONFIDENCE_THRESHOLD = 0.7`. Si la confianza es baja se pide
  confirmación con la opción candidata o se invita a repetir.
- Tests en `src/lib/fuzzyMatch.test.js`.

### US-16 · UX: Estados de Grabación
- `VoiceInput` expone los estados visuales **Grabando** (con temporizador
  y punto pulsante), **Procesando** y **Listo**. Botón para detener /
  regrabar.
- Mensaje específico cuando el navegador deniega el permiso de
  micrófono.

### US-17 · Resultados: Respuestas por Voz
- El submit de respuestas (`surveyService.submitSurveyResponse`) ahora
  envía `is_voice` por cada respuesta.
- `SurveyResults` consume el nuevo campo `text_entries` del backend,
  muestra un **badge "🎤 por voz"** junto a cada respuesta dictada y
  añade un **buscador por palabra clave** para preguntas abiertas.

### Infra / Tests
- `src/test/setup.js` provee stubs de `VITE_SUPABASE_*` para que los
  tests no fallen al inicializar el cliente Supabase.
- `base.sql` añade la columna `is_voice` a `answers` (incluye
  `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para migrar bases existentes).

## Sprint 3 — Análisis y Cierre

### US-10 · Resultados: Visualización Core
- Nueva página `SurveyResults` (`/surveys/:surveyId/results`) que consume
  `GET /surveys/{id}/results`.
- Nuevo componente `DonutChart` (gráfico circular en SVG, sin dependencias
  extra) para preguntas tipo Test y Sí/No, con leyenda de conteo y porcentaje.
- Feed de texto scrolleable para preguntas abiertas.
- Estado vacío: *"Aún no hay respuestas para esta encuesta"*. El acceso lo
  protege el backend (solo el creador).
- Nuevos métodos `getSurveyResults(id)` y `closeSurvey(id)` en `apiClient`.
- El botón "Ver resultados" del panel ahora navega a la página de resultados
  por id.

> Nota: el proyecto no traía una librería de gráficos y no se puede regenerar
> el lockfile de pnpm aquí, así que el gráfico circular se implementó con SVG
> nativo (pie/donut real).

### US-09 · Gestión: Confirmación de Cierre
- En `Dashboard`, las encuestas en estado **Activa** muestran un botón
  "Cerrar encuesta" que abre un modal de confirmación: *"¿Estás seguro? Esta
  acción impedirá nuevas respuestas permanentemente"*. Al confirmar hace
  `PATCH /surveys/{id}/close`; tras cerrarse, el botón desaparece y el badge
  pasa a **Cerrada**.

### US-06 · Acceso: Estado de Encuesta Cerrada
- `SurveyAccess` muestra *"Esta encuesta ya no acepta más respuestas"* cuando el
  estado es cerrada y no renderiza el formulario de llenado (reutiliza la
  validación de código existente, que ya devuelve el estado).

### US-11 · Distribución: Share Link
- En `Dashboard`, las encuestas en estado **Activa** muestran un botón
  "Copiar enlace" que copia `https://fastforms.app/c/<codigo>` con
  `navigator.clipboard.writeText()` y cambia el texto a "¡Copiado!" durante 2
  segundos.

### Tests
- `src/pages/SurveyAccess.test.jsx` actualizado al nuevo copy de encuesta
  cerrada y verifica que no se renderiza el formulario.

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
- `src/pages/SurveyAccess.test.jsx` cubre el modal de confirmación y el bloqueo
  de reenvío por `LocalStorage`.

import { getToken } from "./gettoken";

// Soporta tanto VITE_API_URL con / final como sin el. Si no esta definido,
// caemos al backend local de desarrollo.
function resolveBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw) return "http://localhost:8000/api/v1/";
  return raw.endsWith("/") ? `${raw}api/v1/` : `${raw}/api/v1/`;
}

const API_BASE_URL = resolveBaseUrl();

async function request(endpoint, options = {}) {
  const token = await getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * Crea una encuesta con sus preguntas (validacion estricta para publicar).
 */
export function createSurvey(surveyData) {
  return request("surveys/", {
    method: "POST",
    body: JSON.stringify(surveyData),
  });
}

/**
 * Lista las encuestas del usuario autenticado (US-02).
 */
export function listSurveys() {
  return request("surveys/", { method: "GET" });
}

/**
 * Publica una encuesta: cambia su estado de borrador a "Publicada" (US-04).
 */
export function publishSurvey(surveyId) {
  return request(`surveys/${surveyId}/publish`, { method: "PATCH" });
}

/**
 * Cierra una encuesta de forma permanente (US-09).
 */
export function closeSurvey(surveyId) {
  return request(`surveys/${surveyId}/close`, { method: "PATCH" });
}

/**
 * Obtiene los resultados agregados de una encuesta (US-10).
 */
export function getSurveyResults(surveyId) {
  return request(`surveys/${surveyId}/results`, { method: "GET" });
}

// ---------- Borradores ----------

/**
 * Guarda un nuevo borrador (permite preguntas y opciones incompletas).
 */
export function saveDraft(draftData) {
  return request("surveys/draft", {
    method: "POST",
    body: JSON.stringify(draftData),
  });
}

/**
 * Actualiza un borrador existente reemplazando sus preguntas.
 */
export function updateDraft(draftId, draftData) {
  return request(`surveys/${draftId}/draft`, {
    method: "PUT",
    body: JSON.stringify(draftData),
  });
}

/**
 * Obtiene una encuesta (con sus preguntas) por id, para reabrir un borrador.
 */
export function getSurvey(surveyId) {
  return request(`surveys/${surveyId}`, { method: "GET" });
}

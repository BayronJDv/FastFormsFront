import { getToken } from "./gettoken";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

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
 * Crea una encuesta publicada con sus preguntas en el backend.
 */
export function createSurvey(surveyData) {
  return request("/surveys/", {
    method: "POST",
    body: JSON.stringify(surveyData),
  });
}

/**
 * Guarda un nuevo borrador. Permite preguntas incompletas y titulo vacio.
 */
export function saveDraft(draftData) {
  return request("/surveys/draft", {
    method: "POST",
    body: JSON.stringify(draftData),
  });
}

/**
 * Actualiza un borrador existente reemplazando sus preguntas.
 */
export function updateDraft(draftId, draftData) {
  return request(`/surveys/${draftId}/draft`, {
    method: "PUT",
    body: JSON.stringify(draftData),
  });
}

/**
 * Obtiene una encuesta (con sus preguntas) por id.
 */
export function getSurvey(surveyId) {
  return request(`/surveys/${surveyId}`, { method: "GET" });
}

/**
 * Lista los borradores del usuario actual.
 */
export function listDrafts() {
  return request("/surveys/drafts", { method: "GET" });
}

import { getToken } from "./gettoken";

const API_BASE_URL =
  import.meta.env.VITE_API_URL+"api/v1/" || "http://localhost:8000/api/v1";

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
 * Crea una encuesta con sus preguntas en el backend.
 * @param {{ title: string, questions: Array }} surveyData
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
 * @param {number|string} surveyId
 */
export function publishSurvey(surveyId) {
  return request(`surveys/${surveyId}/publish`, { method: "PATCH" });
}

/**
 * Cierra una encuesta de forma permanente (US-09).
 * @param {number|string} surveyId
 */
export function closeSurvey(surveyId) {
  return request(`surveys/${surveyId}/close`, { method: "PATCH" });
}

/**
 * Obtiene los resultados agregados de una encuesta (US-10).
 * @param {number|string} surveyId
 */
export function getSurveyResults(surveyId) {
  return request(`surveys/${surveyId}/results`, { method: "GET" });
}

/**
 * Exporta los resultados de una encuesta a CSV y descarga el archivo.
 * Solo el creador de la encuesta puede exportar (validado por el backend).
 * @param {number|string} surveyId
 * @param {string} filename
 */
export async function exportSurveyResultsCsv(surveyId, filename = `encuesta_${surveyId}_resultados.csv`) {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}surveys/${surveyId}/results/csv`, {
    method: "GET",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Error ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

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
 * Crea una encuesta con sus preguntas en el backend.
 * @param {{ title: string, questions: Array }} surveyData
 */
export function createSurvey(surveyData) {
  return request("/surveys/", {
    method: "POST",
    body: JSON.stringify(surveyData),
  });
}

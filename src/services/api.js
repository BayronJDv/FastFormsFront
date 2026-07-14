import { supabase } from "../lib/supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const getToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
};

const request = async (path, options = {}) => {
  const token = await getToken();
  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.detail || `Error ${res.status}`;
    throw new Error(message);
  }

  return res.json();
};

export const generateSurveyFromImage = (imageFile, { language = "es", context = "", numQuestions = 5 } = {}) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("language", language);
  formData.append("context", context);
  formData.append("num_questions", numQuestions);

  return request("/surveys/generate-from-image", {
    method: "POST",
    body: formData,
  });
};

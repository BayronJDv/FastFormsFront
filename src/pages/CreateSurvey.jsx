import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Question from "../components/Question";
import {
  createSurvey,
  saveDraft,
  updateDraft,
  getSurvey,
} from "../lib/apiClient";
import "./CreateSurvey.css";

const QUESTION_TYPE_MAP = {
  open: "open",
  unique_choice: "multiple_choice",
  yes_no: "yes_no",
};

// Inverso: lo que viene del backend a la representacion interna del editor.
const REVERSE_QUESTION_TYPE_MAP = {
  open: "open",
  multiple_choice: "unique_choice",
  yes_no: "yes_no",
};

const CreateSurvey = () => {
  const navigate = useNavigate();
  const { draftId } = useParams();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answersData, setAnswersData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(draftId));

  const questionTypes = [
    { id: "open", label: "Pregunta Abierta" },
    { id: "unique_choice", label: "Opción Múltiple" },
    { id: "yes_no", label: "Sí / No" },
  ];

  // Si entramos con un draftId en la URL, traemos el borrador y repoblamos el editor.
  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    (async () => {
      try {
        const survey = await getSurvey(draftId);
        if (cancelled) return;
        setTitle(
          survey.title && survey.title !== "(sin titulo)" ? survey.title : ""
        );
        const sorted = [...(survey.questions || [])].sort(
          (a, b) => (a.position || 0) - (b.position || 0)
        );
        const loadedQuestions = [];
        const loadedAnswers = {};
        sorted.forEach((q) => {
          const localId = crypto.randomUUID();
          const localType =
            REVERSE_QUESTION_TYPE_MAP[q.question_type] || "open";
          loadedQuestions.push({ id: localId, type: localType });
          loadedAnswers[localId] = {
            statement: q.content || "",
            type: localType,
            options: q.options || undefined,
          };
        });
        setQuestions(loadedQuestions);
        setAnswersData(loadedAnswers);
      } catch (err) {
        alert(`Error al cargar el borrador: ${err.message}`);
      } finally {
        if (!cancelled) setIsLoadingDraft(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const handleQuestionChange = useCallback((id, data) => {
    setAnswersData((prev) => ({ ...prev, [id]: data }));
  }, []);

  const handleAddQuestion = (type) => {
    const newId = crypto.randomUUID();
    setQuestions((prev) => [...prev, { id: newId, type }]);
  };

  const handleRemoveQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setAnswersData((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  // Construye el payload aceptado por el backend, tanto para publicar como para guardar borrador.
  const buildPayload = () => ({
    title: title.trim(),
    questions: questions.map((q, index) => {
      const data = answersData[q.id] || { statement: "", type: q.type };
      const mapped = {
        content: data.statement || "",
        question_type: QUESTION_TYPE_MAP[data.type],
        position: index + 1,
      };
      if (
        data.type === "unique_choice" &&
        Array.isArray(data.options) &&
        data.options.length > 0
      ) {
        mapped.options = data.options;
      }
      return mapped;
    }),
  });

  const handleSubmit = async () => {
    if (!title.trim()) return alert("El título de la encuesta es obligatorio");
    if (questions.length === 0) return alert("Añade al menos una pregunta");

    const values = Object.values(answersData);
    const hasEmptyStatements = values.some((q) => !q.statement.trim());
    if (hasEmptyStatements)
      return alert("Todas las preguntas deben tener un enunciado");

    setIsSubmitting(true);
    try {
      const result = await createSurvey(buildPayload());
      alert(`Encuesta creada. Código: ${result.unique_code}`);
      navigate("/dashboard");
    } catch (err) {
      alert(`Error al crear la encuesta: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const payload = buildPayload();
      const result = draftId
        ? await updateDraft(draftId, payload)
        : await saveDraft(payload);
      alert("Borrador guardado.");
      if (!draftId && result?.id) {
        // Reemplazamos la URL para que sucesivos 'guardar' actualicen este mismo borrador
        // en lugar de crear duplicados.
        navigate(`/create-survey/${result.id}`, { replace: true });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      alert(`Error al guardar el borrador: ${err.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  if (isLoadingDraft) {
    return <div className="survey-page">Cargando borrador...</div>;
  }

  return (
    <div className="survey-page">
      {/* HEADER */}
      <div className="survey-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ←
        </button>

        <div className="header-buttons">
          <button
            className="draft-btn"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSubmitting}
          >
            {isSavingDraft ? "Guardando..." : "Guardar borrador"}
          </button>

          <button
            className="publish-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || isSavingDraft}
          >
            {isSubmitting ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>

      {/* INFO ENCUESTA */}
      <div className="card">
        <h3>Información de la Encuesta</h3>

        <label>Título de la encuesta *</label>
        <input
          type="text"
          placeholder="Ej: Encuesta de Satisfacción del Cliente"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label>Descripción (opcional)</label>
        <textarea placeholder="Una breve descripción de tu encuesta..." />
      </div>

      {/* PREGUNTAS */}
      <div className="card">
        <h3>Preguntas ({questions.length}/12)</h3>

        {questions.length === 0 ? (
          <div className="empty-box">
            Aún no has agregado preguntas. Comienza agregando tu primera
            pregunta.
          </div>
        ) : (
          questions.map((q) => {
            const initial = answersData[q.id];
            return (
              <div key={q.id} className="question-container">
                <div className="question-toolbar">
                  <span className="question-chip">Pregunta</span>

                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleRemoveQuestion(q.id)}
                  >
                    Eliminar
                  </button>
                </div>

                <Question
                  id={q.id}
                  type={q.type}
                  onChange={handleQuestionChange}
                  initialStatement={initial?.statement || ""}
                  initialOptions={initial?.options || null}
                />
              </div>
            );
          })
        )}
      </div>

      {/* AGREGAR PREGUNTA */}
      <div className="card">
        <p className="add-question-text">Agregar pregunta:</p>

        <div className="question-buttons">
          {questionTypes.map((type) => (
            <button
              key={type.id}
              className="add-question-btn"
              onClick={() => handleAddQuestion(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateSurvey;

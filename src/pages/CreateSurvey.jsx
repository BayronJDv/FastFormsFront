import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Question from "../components/Question";
import { createSurvey } from "../lib/apiClient";
import "./CreateSurvey.css";

const QUESTION_TYPE_MAP = {
  open: "open",
  unique_choice: "multiple_choice",
  yes_no: "yes_no",
};

const CreateSurvey = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answersData, setAnswersData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionTypes = [
    { id: "open", label: "Pregunta Abierta" },
    { id: "unique_choice", label: "Opción Múltiple" },
    { id: "yes_no", label: "Sí / No" },
  ];

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

  const handleSubmit = async () => {
    if (!title.trim()) return alert("El título de la encuesta es obligatorio");
    if (questions.length === 0) return alert("Añade al menos una pregunta");

    const values = Object.values(answersData);
    const hasEmptyStatements = values.some((q) => !q.statement.trim());
    if (hasEmptyStatements)
      return alert("Todas las preguntas deben tener un enunciado");

    const payload = {
      title: title.trim(),
      questions: questions.map((q, index) => {
        const data = answersData[q.id];
        const mapped = {
          content: data.statement,
          question_type: QUESTION_TYPE_MAP[data.type],
          position: index + 1,
        };
        if (data.type === "unique_choice" && data.options) {
          mapped.options = data.options;
        }
        return mapped;
      }),
    };

    setIsSubmitting(true);
    try {
      const result = await createSurvey(payload);
      alert(`Encuesta creada. Código: ${result.unique_code}`);
      navigate("/dashboard");
    } catch (err) {
      alert(`Error al crear la encuesta: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="survey-page">

      {/* HEADER */}
      <div className="survey-header">

        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ←   
        </button>

        <div className="header-buttons">
          <button className="draft-btn">Guardar borrador</button>

          <button className="publish-btn" onClick={handleSubmit} disabled={isSubmitting}>
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
          questions.map((q) => (
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
              />
            </div>
          ))
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

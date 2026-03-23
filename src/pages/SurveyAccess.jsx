import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SurveyQuestionField from "../components/SurveyQuestionField";
import { fetchSurveyByCode, submitSurveyResponse } from "../lib/surveyService";
import "./SurveyAccess.css";

const buildInitialAnswers = (questions) =>
  questions.reduce((accumulator, question) => {
    accumulator[question.id] = "";
    return accumulator;
  }, {});

const SurveyAccess = () => {
  const navigate = useNavigate();
  const { surveyCode: surveyCodeFromParams } = useParams();
  const [searchParams] = useSearchParams();
  const surveyCodeFromQuery = searchParams.get("code");
  const surveyCode = (surveyCodeFromParams || surveyCodeFromQuery || "").trim().toUpperCase();

  const [viewState, setViewState] = useState("loading");
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [technicalError, setTechnicalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState({ type: "", message: "" });

  useEffect(() => {
    let ignore = false;

    const loadSurvey = async () => {
      setViewState("loading");
      setSurvey(null);
      setAnswers({});
      setFieldErrors({});
      setTechnicalError("");
      setSubmitState({ type: "", message: "" });

      try {
        const result = await fetchSurveyByCode(surveyCode);

        if (ignore) {
          return;
        }

        setViewState(result.status);
        setSurvey(result.survey ?? null);
        setAnswers(buildInitialAnswers(result.survey?.questions ?? []));
      } catch (error) {
        if (ignore) {
          return;
        }

        setViewState("api_error");
        setTechnicalError(error.message || "No fue posible cargar la encuesta en este momento.");
      }
    };

    loadSurvey();

    return () => {
      ignore = true;
    };
  }, [surveyCode]);

  const hasQuestions = Array.isArray(survey?.questions) && survey.questions.length > 0;

  const questionCountLabel = useMemo(() => {
    if (!hasQuestions) {
      return "0 preguntas";
    }

    return `${survey.questions.length} pregunta${survey.questions.length === 1 ? "" : "s"}`;
  }, [hasQuestions, survey]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));

    setFieldErrors((current) => {
      if (!current[questionId]) {
        return current;
      }

      const updatedErrors = { ...current };
      delete updatedErrors[questionId];
      return updatedErrors;
    });
  };

  const validateAnswers = () => {
    if (!hasQuestions) {
      return {};
    }

    return survey.questions.reduce((accumulator, question) => {
      const answerValue = String(answers[question.id] ?? "").trim();

      if (!answerValue) {
        accumulator[question.id] = "Esta pregunta es obligatoria.";
      }

      return accumulator;
    }, {});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!survey?.id || !hasQuestions) {
      return;
    }

    const nextErrors = validateAnswers();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitState({
        type: "error",
        message: "Completa las preguntas obligatorias antes de enviar.",
      });
      return;
    }

    setSubmitting(true);
    setSubmitState({ type: "", message: "" });

    try {
      await submitSurveyResponse({
        surveyId: survey.id,
        answers: survey.questions.map((question) => ({
          questionId: question.id,
          answer: String(answers[question.id] ?? "").trim(),
        })),
      });

      setSubmitState({
        type: "success",
        message: "Tus respuestas fueron enviadas correctamente.",
      });
    } catch (error) {
      setSubmitState({
        type: "error",
        message: error.message || "No fue posible enviar tus respuestas.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="survey-access-page">
      <div className="survey-access-shell">
        <div className="survey-access-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ←
          </button>

          <div className="survey-access-code">
            Código: <strong>{surveyCode || "Sin código"}</strong>
          </div>
        </div>

        {viewState === "loading" ? (
          <section className="survey-state-card">
            <h2>Cargando encuesta...</h2>
            <p>Estamos consultando la información para mostrarte el formulario.</p>
          </section>
        ) : null}

        {viewState === "invalid_code" ? (
          <section className="survey-state-card">
            <h2>Código no válido</h2>
            <p>El código ingresado no existe o no está asociado a una encuesta disponible.</p>
          </section>
        ) : null}

        {viewState === "survey_closed" ? (
          <section className="survey-state-card">
            <h2>Encuesta cerrada</h2>
            <p>Esta encuesta ya no está disponible para recibir respuestas.</p>
            {survey?.title ? <span className="survey-state-meta">{survey.title}</span> : null}
          </section>
        ) : null}

        {viewState === "empty" ? (
          <section className="survey-state-card">
            <h2>Encuesta sin preguntas</h2>
            <p>La encuesta existe, pero todavía no tiene preguntas publicadas.</p>
          </section>
        ) : null}

        {viewState === "api_error" ? (
          <section className="survey-state-card">
            <h2>Error técnico</h2>
            <p>{technicalError}</p>
          </section>
        ) : null}

        {viewState === "ready" && survey ? (
          <form className="survey-form-layout" onSubmit={handleSubmit}>
            <section className="card survey-intro-card">
              <span className="survey-chip">Encuesta disponible</span>
              <h1>{survey.title}</h1>
              <p>Responde el formulario dinámicamente cargado desde el backend.</p>
              <span className="survey-state-meta">{questionCountLabel}</span>
            </section>

            <section className="card">
              <h3>Preguntas</h3>

              {survey.questions.map((question) => (
                <SurveyQuestionField
                  key={question.id}
                  question={question}
                  value={answers[question.id] ?? ""}
                  error={fieldErrors[question.id]}
                  onChange={handleAnswerChange}
                />
              ))}
            </section>

            <section className="card survey-submit-card">
              {submitState.message ? (
                <p className={submitState.type === "success" ? "survey-submit-success" : "survey-submit-error"}>
                  {submitState.message}
                </p>
              ) : null}

              <button className="publish-btn" type="submit" disabled={submitting}>
                {submitting ? "Enviando respuestas..." : "Enviar respuestas"}
              </button>
            </section>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default SurveyAccess;

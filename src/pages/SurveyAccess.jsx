import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SurveyQuestionField from "../components/SurveyQuestionField";
import ConfirmModal from "../components/ConfirmModal";
import { fetchSurveyByCode, submitSurveyResponse } from "../lib/surveyService";
import "./SurveyAccess.css";

const ANSWERED_STORAGE_PREFIX = "fastforms:answered:";

const buildInitialAnswers = (questions) =>
  questions.reduce((accumulator, question) => {
    accumulator[question.id] = "";
    return accumulator;
  }, {});

const storageKeyFor = (surveyCode) => `${ANSWERED_STORAGE_PREFIX}${surveyCode}`;

const hasAlreadyAnswered = (surveyCode) => {
  if (!surveyCode) return false;
  try {
    return window.localStorage.getItem(storageKeyFor(surveyCode)) === "true";
  } catch {
    return false;
  }
};

const markAsAnswered = (surveyCode) => {
  if (!surveyCode) return;
  try {
    window.localStorage.setItem(storageKeyFor(surveyCode), "true");
  } catch {
    /* localStorage no disponible: el bloqueo simplemente no persiste */
  }
};

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
  const [submitError, setSubmitError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadSurvey = async () => {
      setSurvey(null);
      setAnswers({});
      setFieldErrors({});
      setTechnicalError("");
      setSubmitError("");
      setShowConfirmModal(false);

      // US-08 — si ya respondió esta encuesta (LocalStorage), no la volvemos a cargar
      if (hasAlreadyAnswered(surveyCode)) {
        setViewState("already_answered");
        return;
      }

      setViewState("loading");

      try {
        const result = await fetchSurveyByCode(surveyCode);
        if (ignore) return;

        setViewState(result.status);
        setSurvey(result.survey ?? null);
        setAnswers(buildInitialAnswers(result.survey?.questions ?? []));
      } catch (error) {
        if (ignore) return;
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

  const handleRequestSubmit = (event) => {
    event.preventDefault();

    if (!survey?.id || !hasQuestions) {
      return;
    }

    const nextErrors = validateAnswers();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitError("Completa las preguntas obligatorias antes de enviar.");
      return;
    }

    setSubmitError("");
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    if (!survey?.id || !hasQuestions) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await submitSurveyResponse({
        surveyId: survey.id,
        answers: survey.questions.map((question) => ({
          questionId: question.id,
          answer: String(answers[question.id] ?? "").trim(),
        })),
      });

      markAsAnswered(surveyCode);
      setShowConfirmModal(false);
      setViewState("submitted");
    } catch (error) {
      setShowConfirmModal(false);
      setSubmitError(error.message || "No fue posible enviar tus respuestas.");
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

        {viewState === "already_answered" ? (
          <section className="survey-state-card">
            <h2>Ya has respondido esta encuesta</h2>
            <p>Solo se permite una respuesta por persona. ¡Gracias por participar!</p>
          </section>
        ) : null}

        {viewState === "submitted" ? (
          <section className="survey-state-card survey-thanks-card">
            <h2>¡Gracias por responder!</h2>
            <p>Tus respuestas fueron enviadas correctamente.</p>
            <button className="publish-btn" type="button" onClick={() => navigate("/")}>
              Volver al inicio
            </button>
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
          <form className="survey-form-layout" onSubmit={handleRequestSubmit}>
            <section className="card survey-intro-card">
              <span className="survey-chip">Encuesta disponible</span>
              <h1>{survey.title}</h1>
              <p>Responde todas las preguntas en una sola página y envía cuando termines.</p>
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
              {submitError ? <p className="survey-submit-error">{submitError}</p> : null}

              <button className="publish-btn" type="submit" disabled={submitting}>
                {submitting ? "Enviando respuestas..." : "Enviar respuestas"}
              </button>
            </section>
          </form>
        ) : null}

        <ConfirmModal
          open={showConfirmModal}
          title="Confirmar envío"
          message="¿Deseas enviar tus respuestas ahora? No podrás modificarlas después."
          confirmLabel="Confirmar envío"
          cancelLabel="Revisar de nuevo"
          busy={submitting}
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirmModal(false)}
        />
      </div>
    </div>
  );
};

export default SurveyAccess;

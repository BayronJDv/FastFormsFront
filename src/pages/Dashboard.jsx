import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { userAtom } from "../stores/authAtom";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import { listSurveys, closeSurvey } from "../lib/apiClient";
import "./Dashboard.css";

const STATUS_META = {
  draft: { label: "Borrador", className: "status-badge status-draft" },
  active: { label: "Activa", className: "status-badge status-active" },
  closed: { label: "Cerrada", className: "status-badge status-closed" },
};

const API_BASE_URL = import.meta.env.VITE_API_URL+"api/v1/" 

const Dashboard = () => {
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");

  const [surveyToClose, setSurveyToClose] = useState(null);
  const [closing, setClosing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let ignore = false;

    const load = async () => {
      setLoadState("loading");
      try {
        const data = await listSurveys();
        if (ignore) return;
        setSurveys(Array.isArray(data) ? data : []);
        setLoadState("ready");
      } catch (error) {
        if (ignore) return;
        setErrorMessage(error.message || "No fue posible cargar tus encuestas.");
        setLoadState("error");
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCopyLink = async (survey) => {
    const link = `${API_BASE_URL}survey/${survey.unique_code}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* clipboard no disponible: igual mostramos el feedback */
    }
    setCopiedCode(survey.unique_code);
    setTimeout(() => {
      setCopiedCode((current) => (current === survey.unique_code ? null : current));
    }, 2000);
  };

  const confirmClose = async () => {
    if (!surveyToClose) return;
    setClosing(true);
    try {
      const updated = await closeSurvey(surveyToClose.id);
      setSurveys((current) =>
        current.map((survey) =>
          survey.id === surveyToClose.id
            ? { ...survey, ...updated, status: "closed" }
            : survey
        )
      );
      setSurveyToClose(null);
    } catch (error) {
      alert(`No fue posible cerrar la encuesta: ${error.message}`);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Mis encuestas</h1>
          {user?.name ? <p className="dashboard-greeting">Hola, {user.name}</p> : null}
        </div>
        <button className="dashboard-create-btn" onClick={() => navigate("/create-survey")}>
          + Crear encuesta
        </button>
      </div>

      {loadState === "loading" ? (
        <p className="dashboard-state">Cargando tus encuestas...</p>
      ) : null}

      {loadState === "error" ? (
        <p className="dashboard-state dashboard-state-error">{errorMessage}</p>
      ) : null}

      {loadState === "ready" && surveys.length === 0 ? (
        <p className="dashboard-state">Aún no has creado encuestas. ¡Crea la primera!</p>
      ) : null}

      {loadState === "ready" && surveys.length > 0 ? (
        <ul className="dashboard-list">
          {surveys.map((survey) => {
            const meta =
              STATUS_META[survey.status] ?? { label: survey.status, className: "status-badge" };
            const isDraft = survey.status === "draft";
            const isActive = survey.status === "active";

            return (
              <li key={survey.id} className="dashboard-item">
                <div className="dashboard-item-main">
                  <span className="dashboard-item-title">{survey.title}</span>
                  {survey.unique_code ? (
                    <span className="dashboard-item-code">Código: {survey.unique_code}</span>
                  ) : null}
                </div>

                <span className={meta.className}>{meta.label}</span>

                <div className="dashboard-item-actions">
                  {isDraft ? (
                    <button
                      className="dashboard-action-btn"
                      onClick={() => navigate("/create-survey")}
                    >
                      Editar
                    </button>
                  ) : (
                    <button
                      className="dashboard-action-btn"
                      onClick={() => navigate(`/surveys/${survey.id}/results`)}
                    >
                      Ver resultados
                    </button>
                  )}

                  {isActive ? (
                    <>
                      <button
                        className="dashboard-action-btn"
                        onClick={() => handleCopyLink(survey)}
                      >
                        {copiedCode === survey.unique_code ? "¡Copiado!" : "Copiar enlace"}
                      </button>
                      <button
                        className="dashboard-action-btn dashboard-action-danger"
                        onClick={() => setSurveyToClose(survey)}
                      >
                        Cerrar encuesta
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <ConfirmModal
        open={Boolean(surveyToClose)}
        title="Cerrar encuesta"
        message="¿Estás seguro? Esta acción impedirá nuevas respuestas permanentemente."
        confirmLabel="Sí, cerrar"
        cancelLabel="Cancelar"
        busy={closing}
        onConfirm={confirmClose}
        onCancel={() => setSurveyToClose(null)}
      />
    </div>
  );
};

export default Dashboard;

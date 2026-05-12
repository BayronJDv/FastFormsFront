import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { userAtom } from "../stores/authAtom";
import { useNavigate } from "react-router-dom";
import { listSurveys } from "../lib/apiClient";
import "./Dashboard.css";

const STATUS_META = {
  draft: { label: "Borrador", className: "status-badge status-draft" },
  active: { label: "Activa", className: "status-badge status-active" },
  closed: { label: "Cerrada", className: "status-badge status-closed" },
};

const Dashboard = () => {
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
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
                      onClick={() => navigate(`/survey/${survey.unique_code}/results`)}
                    >
                      Ver resultados
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export default Dashboard;

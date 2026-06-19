import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DonutChart from "../components/DonutChart";
import { getSurveyResults, exportSurveyResultsCsv } from "../lib/apiClient";
import "./SurveyResults.css";

const SurveyResults = () => {
  const navigate = useNavigate();
  const { surveyId } = useParams();

  const [state, setState] = useState("loading"); // loading | ready | error
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [csvExporting, setCsvExporting] = useState(false);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setState("loading");
      try {
        const data = await getSurveyResults(surveyId);
        if (ignore) return;
        setResults(data);
        setState("ready");
      } catch (error) {
        if (ignore) return;
        setErrorMessage(error.message || "No fue posible cargar los resultados.");
        setState("error");
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [surveyId]);

  const handleExportCsv = async () => {
    setCsvExporting(true);
    try {
      await exportSurveyResultsCsv(surveyId, results?.title
        ? `encuesta_${results.title.replace(/[^a-zA-Z0-9]/g, "_")}_resultados.csv`
        : undefined
      );
    } catch (error) {
      alert(`No fue posible exportar el CSV: ${error.message}`);
    } finally {
      setCsvExporting(false);
    }
  };

  const responsesLabel =
    results && results.total_responses === 1
      ? "1 respuesta recibida"
      : `${results?.total_responses ?? 0} respuestas recibidas`;

  return (
    <div className="results-page">
      <div className="results-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ←
        </button>
        <h1>{results?.title ? `Resultados · ${results.title}` : "Resultados"}</h1>
      </div>

      {state === "loading" ? (
        <p className="results-state">Cargando resultados...</p>
      ) : null}

      {state === "error" ? (
        <p className="results-state results-state-error">{errorMessage}</p>
      ) : null}

      {state === "ready" && results ? (
        results.total_responses === 0 ? (
          <div className="results-empty-wrapper">
            <p className="results-state">Aún no hay respuestas para esta encuesta</p>
            {results.title ? (
              <button className="csv-export-btn" onClick={handleExportCsv} disabled={csvExporting}>
                {csvExporting ? "Exportando..." : "Exportar CSV"}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="results-list">
            <div className="results-summary-row">
              <p className="results-summary">{responsesLabel}</p>
              <button className="csv-export-btn" onClick={handleExportCsv} disabled={csvExporting}>
                {csvExporting ? "Exportando..." : "Exportar CSV"}
              </button>
            </div>

            {results.questions.map((question) => (
              <section key={question.question_id} className="results-card">
                <h3>{question.content}</h3>

                {question.question_type === "open" ? (
                  question.texts && question.texts.length > 0 ? (
                    <ul className="results-text-feed">
                      {question.texts.map((text, index) => (
                        <li key={index}>{text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="results-empty-question">
                      Sin respuestas para esta pregunta.
                    </p>
                  )
                ) : question.total_answers > 0 ? (
                  <DonutChart data={question.options ?? []} />
                ) : (
                  <p className="results-empty-question">
                    Sin respuestas para esta pregunta.
                  </p>
                )}
              </section>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
};

export default SurveyResults;

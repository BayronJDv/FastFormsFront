import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DonutChart from "../components/DonutChart";
import { getSurveyResults, exportSurveyResultsCsv } from "../lib/apiClient";
import "./SurveyResults.css";

// US-17 — Normaliza una pregunta abierta a entradas {text, is_voice} para
// poder mostrar el badge "por voz" sin perder retrocompatibilidad con el
// formato anterior (`texts`).
const toTextEntries = (question) => {
  if (Array.isArray(question.text_entries) && question.text_entries.length > 0) {
    return question.text_entries.map((entry) => ({
      text: entry?.text ?? "",
      isVoice: Boolean(entry?.is_voice),
    }));
  }
  if (Array.isArray(question.texts)) {
    return question.texts.map((text) => ({ text, isVoice: false }));
  }
  return [];
};

const SurveyResults = () => {
  const navigate = useNavigate();
  const { surveyId } = useParams();

  const [state, setState] = useState("loading"); // loading | ready | error
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [csvExporting, setCsvExporting] = useState(false);
  // US-17 — Filtro de busqueda por palabra clave sobre transcripciones.
  const [textSearch, setTextSearch] = useState("");

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

  const normalizedSearch = textSearch.trim().toLowerCase();
  const hasOpenQuestion = useMemo(
    () => Boolean(results?.questions?.some((q) => q.question_type === "open")),
    [results]
  );

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

            {hasOpenQuestion ? (
              <div className="results-search-row">
                <input
                  type="search"
                  className="results-search-input"
                  placeholder="Buscar palabra clave en respuestas abiertas..."
                  value={textSearch}
                  onChange={(event) => setTextSearch(event.target.value)}
                />
              </div>
            ) : null}

            {results.questions.map((question) => {
              const isOpen = question.question_type === "open";
              const entries = isOpen ? toTextEntries(question) : [];
              const filteredEntries = normalizedSearch
                ? entries.filter((entry) =>
                    entry.text.toLowerCase().includes(normalizedSearch)
                  )
                : entries;

              return (
                <section key={question.question_id} className="results-card">
                  <h3>{question.content}</h3>

                  {isOpen ? (
                    entries.length > 0 ? (
                      filteredEntries.length > 0 ? (
                        <ul className="results-text-feed">
                          {filteredEntries.map((entry, index) => (
                            <li key={index} className="results-text-feed-item">
                              <span>{entry.text}</span>
                              {entry.isVoice ? (
                                <span
                                  className="results-voice-badge"
                                  title="Respuesta dictada por voz"
                                  aria-label="Respuesta por voz"
                                >
                                  🎤 por voz
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="results-empty-question">
                          Ninguna respuesta coincide con "{textSearch}".
                        </p>
                      )
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
              );
            })}
          </div>
        )
      ) : null}
    </div>
  );
};

export default SurveyResults;

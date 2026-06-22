import { useState } from "react";
import VoiceInput from "./VoiceInput";
import { CONFIDENCE_THRESHOLD, findBestOptionMatch } from "../lib/fuzzyMatch";

const SurveyQuestionField = ({ question, value, error, onChange, onVoiceFlag }) => {
  const fieldId = `survey-question-${question.id}`;
  const questionType = question.type;

  // US-15 — Cuando el matching tiene baja confianza pedimos confirmacion antes
  // de marcar la opcion.
  const [pendingMatch, setPendingMatch] = useState(null);

  // US-18 — En respuestas abiertas dejamos que Whisper detecte el idioma.
  const handleVoiceOpen = ({ text, language }) => {
    if (!text) return;
    onChange(question.id, text);
    onVoiceFlag?.(question.id, true, language);
  };

  const handleVoiceChoice = ({ text, confidence, language }) => {
    if (!text) return;
    const options = questionType === "yes_no" ? ["Sí", "No"] : question.options || [];
    const { option, score } = findBestOptionMatch(text, options);

    if (!option) {
      setPendingMatch({ transcript: text, candidate: null, score: 0, confidence, language });
      return;
    }

    const lowConfidence =
      score < CONFIDENCE_THRESHOLD ||
      (typeof confidence === "number" && confidence < CONFIDENCE_THRESHOLD);

    if (lowConfidence) {
      setPendingMatch({ transcript: text, candidate: option, score, confidence, language });
      return;
    }

    onChange(question.id, option);
    onVoiceFlag?.(question.id, true, language);
    setPendingMatch(null);
  };

  const confirmPendingMatch = () => {
    if (!pendingMatch?.candidate) return;
    onChange(question.id, pendingMatch.candidate);
    onVoiceFlag?.(question.id, true, pendingMatch.language);
    setPendingMatch(null);
  };

  const discardPendingMatch = () => setPendingMatch(null);

  return (
    <div className="survey-question-card">
      <div className="survey-question-label">
        <span>{question.content}</span>
        <span className="survey-required-badge">Obligatoria</span>
      </div>

      {questionType === "open" ? (
        <>
          <textarea
            id={fieldId}
            className={`survey-answer-input ${error ? "survey-answer-input-error" : ""}`}
            value={value}
            onChange={(event) => {
              onChange(question.id, event.target.value);
              onVoiceFlag?.(question.id, false);
            }}
            placeholder="Escribe tu respuesta"
            rows={4}
          />
          <VoiceInput
            onResult={handleVoiceOpen}
            language="auto"
            label="Responder por voz"
            recordingLabel="Detener"
          />
        </>
      ) : null}

      {questionType === "multiple_choice" || questionType === "unique_choice" ? (
        <>
          <div className="survey-options-list" role="radiogroup" aria-labelledby={fieldId}>
            {question.options.map((option) => (
              <label key={option} className={`survey-option-item ${value === option ? "survey-option-item-selected" : ""}`}>
                <input
                  type="radio"
                  name={fieldId}
                  value={option}
                  checked={value === option}
                  onChange={(event) => {
                    onChange(question.id, event.target.value);
                    onVoiceFlag?.(question.id, false);
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <VoiceInput
            onResult={handleVoiceChoice}
            label="Elegir por voz"
            recordingLabel="Detener"
          />
        </>
      ) : null}

      {questionType === "yes_no" ? (
        <>
          <div className="survey-options-list" role="radiogroup" aria-labelledby={fieldId}>
            {["Sí", "No"].map((option) => (
              <label key={option} className={`survey-option-item ${value === option ? "survey-option-item-selected" : ""}`}>
                <input
                  type="radio"
                  name={fieldId}
                  value={option}
                  checked={value === option}
                  onChange={(event) => {
                    onChange(question.id, event.target.value);
                    onVoiceFlag?.(question.id, false);
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <VoiceInput
            onResult={handleVoiceChoice}
            label="Responder por voz"
            recordingLabel="Detener"
          />
        </>
      ) : null}

      {pendingMatch ? (
        <div className="survey-voice-confirm" role="status">
          <p>
            Escuche: <em>"{pendingMatch.transcript}"</em>.
            {pendingMatch.candidate
              ? ` ¿Querias decir "${pendingMatch.candidate}"?`
              : " No encontre una opcion similar."}
          </p>
          <div className="survey-voice-confirm-actions">
            {pendingMatch.candidate ? (
              <button type="button" className="publish-btn" onClick={confirmPendingMatch}>
                Sí, confirmar
              </button>
            ) : null}
            <button type="button" className="draft-btn" onClick={discardPendingMatch}>
              Volver a intentar
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="survey-field-error">{error}</p> : null}
    </div>
  );
};

export default SurveyQuestionField;

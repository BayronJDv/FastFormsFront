const SurveyQuestionField = ({ question, value, error, onChange }) => {
  const fieldId = `survey-question-${question.id}`;
  const questionType = question.type;

  return (
    <div className="survey-question-card">
      <div className="survey-question-label">
        <span>{question.content}</span>
        <span className="survey-required-badge">Obligatoria</span>
      </div>

      {questionType === "open" ? (
        <textarea
          id={fieldId}
          className={`survey-answer-input ${error ? "survey-answer-input-error" : ""}`}
          value={value}
          onChange={(event) => onChange(question.id, event.target.value)}
          placeholder="Escribe tu respuesta"
          rows={4}
        />
      ) : null}

      {questionType === "multiple_choice" || questionType === "unique_choice" ? (
        <div className="survey-options-list" role="radiogroup" aria-labelledby={fieldId}>
          {question.options.map((option) => (
            <label key={option} className="survey-option-item">
              <input
                type="radio"
                name={fieldId}
                value={option}
                checked={value === option}
                onChange={(event) => onChange(question.id, event.target.value)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : null}

      {questionType === "yes_no" ? (
        <div className="survey-options-list" role="radiogroup" aria-labelledby={fieldId}>
          {["Sí", "No"].map((option) => (
            <label key={option} className="survey-option-item">
              <input
                type="radio"
                name={fieldId}
                value={option}
                checked={value === option}
                onChange={(event) => onChange(question.id, event.target.value)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : null}

      {error ? <p className="survey-field-error">{error}</p> : null}
    </div>
  );
};

export default SurveyQuestionField;

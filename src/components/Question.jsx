import React, { useState, useEffect, memo } from 'react';
import VoiceInput from './VoiceInput';

const Question = memo(({
  id,
  type,
  onChange,
  initialStatement = '',
  initialOptions = null,
}) => {
  const [statement, setStatement] = useState(initialStatement);
  const [choices, setChoices] = useState(() =>
    initialOptions && initialOptions.length > 0
      ? initialOptions.map(value => ({ id: crypto.randomUUID(), value }))
      : []
  );

  useEffect(() => {
    const data = { statement, type };
    if (type === 'unique_choice') {
      data.options = choices.map(c => c.value);
    }
    onChange(id, data);
  }, [statement, choices, id, type, onChange]);

  const handleChoiceChange = (choiceId, value) => {
    setChoices(prev => prev.map(c => c.id === choiceId ? { ...c, value } : c));
  };

  // US-13 — Dictado de preguntas: el texto transcrito se inserta en el campo y
  // queda editable. Si ya hay contenido, lo concatena con un espacio.
  const handleVoiceResult = ({ text }) => {
    if (!text) return;
    setStatement(prev => (prev ? `${prev} ${text}`.trim() : text));
  };

  return (
    <div>
      <label htmlFor={`input-${id}`}>Enunciado de la pregunta ({type}):</label>
      <input
        id={`input-${id}`}
        type="text"
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        placeholder="Escribe tu pregunta aquí..."
      />

      <VoiceInput
        onResult={handleVoiceResult}
        label="Dictar enunciado"
        recordingLabel="Detener dictado"
      />

      {type === 'unique_choice' && (
        <div>
          {choices.map((choice) => (
            <input
              key={choice.id}
              value={choice.value}
              onChange={(e) => handleChoiceChange(choice.id, e.target.value)}
              placeholder="Opción"
            />
          ))}
          <button onClick={() => setChoices([...choices, { id: crypto.randomUUID(), value: '' }])}>
            + Opción
          </button>
        </div>
      )}
    </div>
  );
});

export default Question;

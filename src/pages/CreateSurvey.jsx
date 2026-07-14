import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom } from "../stores/authAtom";
import toast from "react-hot-toast";
import Question from "../components/Question";
import ConfirmModal from "../components/ConfirmModal";
import {
  createSurvey,
  publishSurvey,
  saveDraft,
  updateDraft,
  getSurvey,
  generateSurveyDraft,
} from "../lib/apiClient";
import { generateSurveyFromImage } from "../services/api";
import "./CreateSurvey.css";

const QUESTION_TYPE_MAP = {
  open: "open",
  unique_choice: "multiple_choice",
  yes_no: "yes_no",
};

const REVERSE_QUESTION_TYPE_MAP = {
  open: "open",
  multiple_choice: "unique_choice",
  yes_no: "yes_no",
};

const MAX_AI_QUESTIONS = 12;
const MIN_AI_PROMPT = 5;

const CreateSurvey = () => {
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();
  const { draftId } = useParams();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answersData, setAnswersData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(draftId));
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiConfirm, setShowAiConfirm] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [visionContext, setVisionContext] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const questionTypes = [
    { id: "open", label: "Pregunta Abierta" },
    { id: "unique_choice", label: "Opción Múltiple" },
    { id: "yes_no", label: "Sí / No" },
  ];

  const mapBackendType = (backendType) => {
    const map = { multiple_choice: "unique_choice" };
    return map[backendType] || backendType;
  };

  // Si entramos con :draftId en la URL, traemos el borrador y repoblamos el editor.
  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    (async () => {
      try {
        const survey = await getSurvey(draftId);
        if (cancelled) return;
        setTitle(
          survey.title && survey.title !== "(sin titulo)" ? survey.title : ""
        );
        const sorted = [...(survey.questions || [])].sort(
          (a, b) => (a.position || 0) - (b.position || 0)
        );
        const loadedQuestions = [];
        const loadedAnswers = {};
        sorted.forEach((q) => {
          const localId = crypto.randomUUID();
          const localType =
            REVERSE_QUESTION_TYPE_MAP[q.question_type] || "open";
          loadedQuestions.push({ id: localId, type: localType });
          loadedAnswers[localId] = {
            statement: q.content || "",
            type: localType,
            options: q.options || undefined,
          };
        });
        setQuestions(loadedQuestions);
        setAnswersData(loadedAnswers);
      } catch (err) {
        toast.error(`Error al cargar el borrador: ${err.message}`);
      } finally {
        if (!cancelled) setIsLoadingDraft(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

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

  // Payload estricto para publicar (todas las validaciones obligatorias).
  const buildStrictPayload = () => ({
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
  });

  // Payload relajado para borradores (permite preguntas / opciones incompletas).
  const buildDraftPayload = () => ({
    title: title.trim(),
    questions: questions.map((q, index) => {
      const data = answersData[q.id] || { statement: "", type: q.type };
      const mapped = {
        content: data.statement || "",
        question_type: QUESTION_TYPE_MAP[data.type],
        position: index + 1,
      };
      if (
        data.type === "unique_choice" &&
        Array.isArray(data.options) &&
        data.options.length > 0
      ) {
        mapped.options = data.options;
      }
      return mapped;
    }),
  });

  const isFormValid = () => {
    if (!title.trim()) {
      toast.error("El título de la encuesta es obligatorio");
      return false;
    }
    if (questions.length === 0) {
      toast.error("Añade al menos una pregunta");
      return false;
    }
    const values = Object.values(answersData);
    const hasEmptyStatements = values.some(
      (q) => !q || !q.statement || !q.statement.trim()
    );
    if (hasEmptyStatements) {
      toast.error("Todas las preguntas deben tener un enunciado");
      return false;
    }
    return true;
  };

  // --- Vision: cámara y archivos ---

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage("");
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const openCamera = async () => {
    setErrorMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCameraStream(stream);
      setShowCameraModal(true);
    } catch {
      setErrorMessage("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(blob);
      setCapturedPhoto({ file, previewUrl });
    }, "image/jpeg", 0.9);
  };

  const confirmCapturedPhoto = () => {
    if (!capturedPhoto) return;
    setSelectedFile(capturedPhoto.file);
    setImagePreview(capturedPhoto.previewUrl);
    setCapturedPhoto(null);
    closeCamera();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCapturedPhoto(null);
  };

  useEffect(() => {
    if (showCameraModal && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCameraModal, cameraStream, capturedPhoto]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setErrorMessage("");
    setVisionContext("");
    setNumQuestions(5);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerateFromImage = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await generateSurveyFromImage(selectedFile, {
        context: visionContext,
        numQuestions,
      });
      setTitle(data.title || "");
      const newQuestions = data.questions.map((q) => ({
        id: crypto.randomUUID(),
        type: mapBackendType(q.question_type),
        initialStatement: q.content,
        initialOptions: q.options || [],
      }));
      setQuestions(newQuestions);
      const newAnswersData = {};
      newQuestions.forEach((q) => {
        newAnswersData[q.id] = {
          statement: q.initialStatement,
          type: q.type,
          ...(q.type === "unique_choice" ? { options: q.initialOptions } : {}),
        };
      });
      setAnswersData(newAnswersData);
      toast.success(`Encuesta generada con ${newQuestions.length} preguntas.`);
    } catch (err) {
      setErrorMessage(err.message || "Error al generar la encuesta desde la imagen.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Borrador y publicación ---

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const payload = buildDraftPayload();
      const result = draftId
        ? await updateDraft(draftId, payload)
        : await saveDraft(payload);
      toast.success("Borrador guardado.");
      if (!draftId && result?.id) {
        navigate(`/create-survey/${result.id}`, { replace: true });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(`Error al guardar el borrador: ${err.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublishClick = () => {
    if (!isFormValid()) return;
    setShowPublishModal(true);
  };

  // US-13 — Genera un borrador con IA. Si ya hay preguntas, pide confirmacion.
  const requestGenerateAI = () => {
    const prompt = aiPrompt.trim();
    if (prompt.length < MIN_AI_PROMPT) {
      toast.error("Describe la idea con al menos 5 caracteres.");
      return;
    }
    const num = Number(aiNumQuestions);
    if (!Number.isInteger(num) || num < 1 || num > MAX_AI_QUESTIONS) {
      toast.error(
        `El número de preguntas debe estar entre 1 y ${MAX_AI_QUESTIONS}.`
      );
      return;
    }
    if (questions.length > 0) {
      setShowAiConfirm(true);
      return;
    }
    performGenerateAI();
  };

  const performGenerateAI = async () => {
    setIsGenerating(true);
    setShowAiConfirm(false);
    try {
      const res = await generateSurveyDraft({
        prompt: aiPrompt.trim(),
        numQuestions: Number(aiNumQuestions),
      });
      setTitle(res.title || "");
      const generated = (res.questions || []).map((q) => {
        const localId = crypto.randomUUID();
        const localType = REVERSE_QUESTION_TYPE_MAP[q.question_type] || "open";
        return {
          id: localId,
          type: localType,
          data: {
            statement: q.content || "",
            type: localType,
            options: q.options || undefined,
          },
        };
      });
      setQuestions(generated.map(({ id, type }) => ({ id, type })));
      setAnswersData(
        generated.reduce((acc, { id, data }) => {
          acc[id] = data;
          return acc;
        }, {})
      );
      setAiPrompt("");
      toast.success(`Borrador generado con ${generated.length} preguntas.`);
    } catch (err) {
      toast.error(`Error al generar con IA: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmPublish = async () => {
    setIsSubmitting(true);
    try {
      let surveyId = draftId;
      if (!surveyId) {
        const created = await createSurvey(buildStrictPayload());
        surveyId = created.id;
      } else {
        await updateDraft(surveyId, buildDraftPayload());
      }
      const published = await publishSurvey(surveyId);
      setShowPublishModal(false);
      toast.success(
        `Encuesta publicada. Código: ${published?.unique_code ?? ""}`
      );
      navigate("/dashboard");
    } catch (err) {
      setShowPublishModal(false);
      toast.error(`Error al publicar la encuesta: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDraft) {
    return <div className="survey-page">Cargando borrador...</div>;
  }

  return (
    <div className="survey-page">
      {/* HEADER */}
      <div className="survey-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ←
        </button>

        <div className="header-buttons">
          <button
            className="draft-btn"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isSavingDraft}
          >
            {isSavingDraft ? "Guardando..." : "Guardar borrador"}
          </button>

          <button
            className="publish-btn"
            onClick={handlePublishClick}
            disabled={isSubmitting || isSavingDraft}
          >
            {isSubmitting ? "Procesando..." : "Publicar"}
          </button>
        </div>
      </div>

      {/* GENERAR DESDE IMAGEN */}
      <div className="card vision-card">
        <h3>Generar desde imagen</h3>
        <p className="vision-subtitle">
          Sube o toma una foto y la IA generará una encuesta automáticamente.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="vision-file-input"
        />
        <canvas ref={canvasRef} className="vision-file-input" />

        {!imagePreview ? (
          <div className="vision-upload-area">
            <button
              className="vision-btn vision-btn-camera"
              onClick={openCamera}
            >
              Tomar foto
            </button>
            <button
              className="vision-btn vision-btn-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              Subir imagen
            </button>
          </div>
        ) : (
          <div className="vision-preview">
            <img src={imagePreview} alt="Vista previa" className="vision-img" />
            <div className="vision-options">
              <label className="vision-label">Contexto (opcional)</label>
              <textarea
                className="vision-textarea"
                placeholder="Ej: Encuesta para evaluar la experiencia del usuario en esta tienda..."
                value={visionContext}
                onChange={(e) => setVisionContext(e.target.value)}
                maxLength={500}
                rows={2}
              />
              <label className="vision-label">Número de preguntas</label>
              <input
                type="number"
                className="vision-num-input"
                min={1}
                max={12}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
              />
            </div>
            <div className="vision-preview-actions">
              <button
                className="vision-btn vision-btn-generate"
                onClick={handleGenerateFromImage}
                disabled={isLoading}
              >
                {isLoading ? "Generando..." : "Generar encuesta"}
              </button>
              <button
                className="vision-btn vision-btn-clear"
                onClick={handleClearImage}
                disabled={isLoading}
              >
                Quitar imagen
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="vision-loading">
            <div className="vision-spinner" />
            <span>Analizando imagen y generando preguntas...</span>
          </div>
        )}

        {errorMessage && (
          <div className="vision-error">{errorMessage}</div>
        )}
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

      {/* ASISTENTE IA */}
      <div className="card ai-card">
        <div className="ai-card-header">
          <span className="ai-card-badge">IA</span>
          <div>
            <h3>Asistente IA</h3>
            <p className="ai-card-subtitle">
              Describe la idea de tu encuesta y la IA generará un borrador con
              las preguntas que indiques.
            </p>
          </div>
        </div>

        <label htmlFor="ai-prompt">Contexto o idea *</label>
        <textarea
          id="ai-prompt"
          placeholder="Ej: Encuesta de satisfacción para usuarios de una app de delivery..."
          value={aiPrompt}
          maxLength={2000}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={3}
        />

        <label htmlFor="ai-num">
          Número de preguntas (máx. {MAX_AI_QUESTIONS})
        </label>
        <input
          id="ai-num"
          type="number"
          min={1}
          max={MAX_AI_QUESTIONS}
          value={aiNumQuestions}
          onChange={(e) => setAiNumQuestions(e.target.value)}
        />

        <button
          type="button"
          className="ai-generate-btn"
          onClick={requestGenerateAI}
          disabled={isGenerating}
        >
          {isGenerating ? "Generando..." : "✨ Generar con IA"}
        </button>
      </div>

      {/* PREGUNTAS */}
      <div className="card">
        <h3>Preguntas ({questions.length}/12)</h3>

        {questions.length === 0 ? (
          <div className="empty-box">
            Aún no has agregado preguntas. Comienza agregando tu primera
            pregunta o genera una desde una imagen.
          </div>
        ) : (
          questions.map((q, index) => {
            const initial = answersData[q.id];
            const typeLabel =
              questionTypes.find((t) => t.id === q.type)?.label ?? "Pregunta";
            return (
              <div key={q.id} className="question-container">
                <div className="question-toolbar">
                  <span className="question-chip">
                    <span className="question-chip-num">{index + 1}</span>
                    {typeLabel}
                  </span>
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
                  initialStatement={initial?.statement || ""}
                  initialOptions={initial?.options || null}
                />
              </div>
            );
          })
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

      <ConfirmModal
        open={showPublishModal}
        title="Publicar encuesta"
        message="Una vez publicada, no podrás editar las preguntas. ¿Deseas publicarla ahora?"
        confirmLabel="Sí, publicar"
        cancelLabel="Cancelar"
        busy={isSubmitting}
        onConfirm={confirmPublish}
        onCancel={() => setShowPublishModal(false)}
      />

      <ConfirmModal
        open={showAiConfirm}
        title="Reemplazar preguntas actuales"
        message="Ya tienes preguntas en el formulario. Si generas con IA, se perderán. ¿Continuar?"
        confirmLabel="Sí, reemplazar"
        cancelLabel="Cancelar"
        busy={isGenerating}
        onConfirm={performGenerateAI}
        onCancel={() => setShowAiConfirm(false)}
      />

      {showCameraModal && (
        <div className="camera-modal-overlay" onClick={closeCamera}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="camera-modal-header">
              <h3>Tomar foto</h3>
              <button className="camera-modal-close" onClick={closeCamera}>X</button>
            </div>

            {!capturedPhoto ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="camera-video" />
                <div className="camera-modal-actions">
                  <button className="vision-btn vision-btn-camera" onClick={captureFrame}>
                    Capturar
                  </button>
                </div>
              </>
            ) : (
              <>
                <img src={capturedPhoto.previewUrl} alt="Foto capturada" className="camera-video" />
                <div className="camera-modal-actions">
                  <button className="vision-btn vision-btn-generate" onClick={confirmCapturedPhoto}>
                    Usar esta foto
                  </button>
                  <button className="vision-btn vision-btn-clear" onClick={retakePhoto}>
                    Tomar otra
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSurvey;

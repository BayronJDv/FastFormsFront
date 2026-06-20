import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SurveyAccess from "./SurveyAccess";
import * as surveyService from "../lib/surveyService";

vi.mock("../lib/surveyService", () => ({
  fetchSurveyByCode: vi.fn(),
  submitSurveyResponse: vi.fn(),
}));

const renderSurveyAccess = (path = "/survey/ABC123") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/survey" element={<SurveyAccess />} />
        <Route path="/survey/:surveyCode" element={<SurveyAccess />} />
      </Routes>
    </MemoryRouter>
  );

describe("SurveyAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("HU1: muestra mensajes claros cuando el codigo no existe o la encuesta fue cerrada", async () => {
    surveyService.fetchSurveyByCode.mockResolvedValueOnce({
      status: "invalid_code",
    });

    const firstRender = renderSurveyAccess("/survey/INVALIDO");

    expect(await screen.findByRole("heading", { name: /código no válido/i })).toBeInTheDocument();
    expect(
      screen.getByText(/no existe o no está asociado a una encuesta disponible/i)
    ).toBeInTheDocument();

    firstRender.unmount();

    surveyService.fetchSurveyByCode.mockResolvedValueOnce({
      status: "survey_closed",
      survey: {
        id: 7,
        title: "Encuesta cerrada de prueba",
        code: "CERRADA1",
      },
    });

    renderSurveyAccess("/survey/CERRADA1");

    expect(await screen.findByRole("heading", { name: /encuesta cerrada/i })).toBeInTheDocument();
    expect(screen.getByText(/ya no acepta más respuestas/i)).toBeInTheDocument();
    expect(screen.getByText("Encuesta cerrada de prueba")).toBeInTheDocument();
    // No se renderiza el formulario de llenado
    expect(screen.queryByRole("button", { name: /enviar respuestas/i })).not.toBeInTheDocument();
  });

  it("HU2: arma el formulario en una sola página y pide confirmación antes de enviar", async () => {
    surveyService.fetchSurveyByCode.mockResolvedValueOnce({
      status: "ready",
      survey: {
        id: 22,
        title: "Encuesta de satisfacción",
        code: "LISTA22",
        questions: [
          { id: 1, type: "open", content: "¿Qué mejorarías?", options: [] },
          {
            id: 2,
            type: "multiple_choice",
            content: "¿Cómo calificas el servicio?",
            options: ["Excelente", "Bueno", "Regular"],
          },
          { id: 3, type: "yes_no", content: "¿Nos recomendarías?", options: [] },
        ],
      },
    });

    surveyService.submitSurveyResponse.mockResolvedValueOnce({ id: 100 });

    renderSurveyAccess("/survey/LISTA22");

    expect(await screen.findByRole("heading", { name: /encuesta de satisfacción/i })).toBeInTheDocument();
    expect(screen.getByText("¿Qué mejorarías?")).toBeInTheDocument();
    expect(screen.getByText("¿Cómo calificas el servicio?")).toBeInTheDocument();
    expect(screen.getByText("¿Nos recomendarías?")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/escribe tu respuesta/i), {
      target: { value: "Más rapidez en soporte" },
    });
    fireEvent.click(screen.getByRole("radio", { name: /excelente/i }));
    fireEvent.click(screen.getByRole("radio", { name: /sí/i }));

    fireEvent.click(screen.getByRole("button", { name: /enviar respuestas/i }));

    // US-08: aparece el modal de confirmación
    expect(await screen.findByText(/¿deseas enviar tus respuestas ahora\?/i)).toBeInTheDocument();
    expect(surveyService.submitSurveyResponse).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /confirmar envío/i }));

    await waitFor(() => {
      expect(surveyService.submitSurveyResponse).toHaveBeenCalledWith({
        surveyId: 22,
        answers: [
          { questionId: 1, answer: "Más rapidez en soporte", isVoice: false, language: null },
          { questionId: 2, answer: "Excelente", isVoice: false, language: null },
          { questionId: 3, answer: "Sí", isVoice: false, language: null },
        ],
      });
    });

    expect(
      await screen.findByText(/tus respuestas fueron enviadas correctamente/i)
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("fastforms:answered:LISTA22")).toBe("true");
  });

  it("HU3: bloquea el reenvío mostrando un mensaje cuando ya se respondió la encuesta", async () => {
    window.localStorage.setItem("fastforms:answered:YALISTO1", "true");

    renderSurveyAccess("/survey/YALISTO1");

    expect(
      await screen.findByRole("heading", { name: /ya has respondido esta encuesta/i })
    ).toBeInTheDocument();
    expect(surveyService.fetchSurveyByCode).not.toHaveBeenCalled();
  });
});

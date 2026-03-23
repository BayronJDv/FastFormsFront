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
    expect(screen.getByText(/ya no está disponible para recibir respuestas/i)).toBeInTheDocument();
    expect(screen.getByText("Encuesta cerrada de prueba")).toBeInTheDocument();
  });

  it("HU2: consulta preguntas y construye el formulario dinamicamente para responder la encuesta", async () => {
    surveyService.fetchSurveyByCode.mockResolvedValueOnce({
      status: "ready",
      survey: {
        id: 22,
        title: "Encuesta de satisfacción",
        code: "LISTA22",
        questions: [
          {
            id: 1,
            type: "open",
            content: "¿Qué mejorarías?",
            options: [],
          },
          {
            id: 2,
            type: "multiple_choice",
            content: "¿Cómo calificas el servicio?",
            options: ["Excelente", "Bueno", "Regular"],
          },
          {
            id: 3,
            type: "yes_no",
            content: "¿Nos recomendarías?",
            options: [],
          },
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

    await waitFor(() => {
      expect(surveyService.submitSurveyResponse).toHaveBeenCalledWith({
        surveyId: 22,
        answers: [
          { questionId: 1, answer: "Más rapidez en soporte" },
          { questionId: 2, answer: "Excelente" },
          { questionId: 3, answer: "Sí" },
        ],
      });
    });

    expect(
      await screen.findByText(/tus respuestas fueron enviadas correctamente/i)
    ).toBeInTheDocument();
  });
});

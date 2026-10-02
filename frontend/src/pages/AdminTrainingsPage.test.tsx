import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { contentApi } from "../api/content";
import { videosApi } from "../api/videos";
import { AdminTrainingsPage } from "./AdminTrainingsPage";

vi.mock("../api/content", () => ({
  contentApi: {
    listTrainings: vi.fn(),
    listModules: vi.fn(),
    createTraining: vi.fn(),
    updateTraining: vi.fn(),
    updateStatus: vi.fn(),
    deleteTraining: vi.fn(),
    createModule: vi.fn(),
    updateModule: vi.fn(),
    deleteModule: vi.fn(),
    reorderModules: vi.fn(),
  },
}));

vi.mock("../api/videos", () => ({
  videosApi: { list: vi.fn() },
}));

const training = {
  id: "training-1",
  title: "Seguridad corporativa",
  description: "Capacitación anual",
  status: "DRAFT" as const,
  createdAt: "2026-07-18T00:00:00.000Z",
  updatedAt: "2026-07-18T00:00:00.000Z",
  createdBy: "admin",
  moduleIds: ["module-1"],
};

const module = {
  id: "module-1",
  trainingId: training.id,
  title: "Introducción",
  description: "Conceptos iniciales",
  order: 0,
  videoIds: [],
  createdAt: "2026-07-18T00:00:00.000Z",
  updatedAt: "2026-07-18T00:00:00.000Z",
};

describe("AdminTrainingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contentApi.listTrainings).mockResolvedValue([training]);
    vi.mocked(contentApi.listModules).mockResolvedValue([module]);
    vi.mocked(videosApi.list).mockResolvedValue([]);
  });

  it("shows clean module cards and expands editing only when requested", async () => {
    vi.mocked(contentApi.updateModule).mockResolvedValue({
      ...module,
      title: "Fundamentos",
    });

    render(
      <MemoryRouter>
        <AdminTrainingsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Selecciona o crea una capacitación."),
    ).toBeInTheDocument();
    expect(contentApi.listModules).not.toHaveBeenCalled();
    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Abrir" }))[0]!,
    );

    expect(await screen.findByText("Introducción")).toBeInTheDocument();
    expect(screen.getByText("Conceptos iniciales")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Videos" })).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Nombre del módulo"),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Más acciones para Introducción",
      }),
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Editar información" }),
    );
    const titleInput = screen.getByLabelText("Nombre del módulo");
    fireEvent.change(titleInput, { target: { value: "Fundamentos" } });
    const editor = titleInput.closest("div.border-t");
    expect(editor).toBeInstanceOf(HTMLElement);
    fireEvent.click(
      within(editor as HTMLElement).getByRole("button", {
        name: "Guardar módulo",
      }),
    );

    await waitFor(() =>
      expect(contentApi.updateModule).toHaveBeenCalledWith("module-1", {
        title: "Fundamentos",
        description: "Conceptos iniciales",
      }),
    );
  });

  it("filters trainings by text and editorial status", async () => {
    vi.mocked(contentApi.listTrainings).mockResolvedValue([
      training,
      {
        ...training,
        id: "training-2",
        title: "Inducción archivada",
        description: "Contenido anterior",
        status: "ARCHIVED",
        moduleIds: [],
      },
    ]);

    render(
      <MemoryRouter>
        <AdminTrainingsPage />
      </MemoryRouter>,
    );

    expect(
      (await screen.findAllByText("Inducción archivada")).length,
    ).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Buscar capacitaciones"), {
      target: { value: "seguridad" },
    });
    expect(screen.queryByText("Inducción archivada")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar capacitaciones"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), {
      target: { value: "ARCHIVED" },
    });
    expect(screen.getAllByText("Inducción archivada").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText("Seguridad corporativa")).not.toBeInTheDocument();
  });

  it("paginates long lists and keeps the table unselected initially", async () => {
    const manyTrainings = Array.from({ length: 10 }, (_, index) => ({
      ...training,
      id: `training-${index + 1}`,
      title: `Capacitación ${String(index + 1).padStart(2, "0")}`,
      updatedAt: `2026-07-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
      moduleIds: [],
    }));
    vi.mocked(contentApi.listTrainings).mockResolvedValue(manyTrainings);

    render(
      <MemoryRouter>
        <AdminTrainingsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Página 1 de 2")).toBeInTheDocument();
    expect(
      screen.getByText("Selecciona o crea una capacitación."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Capacitación 01")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(screen.getAllByText("Capacitación 01").length).toBeGreaterThan(0);
  });

  it("orders the table when a sortable header is activated", async () => {
    vi.mocked(contentApi.listTrainings).mockResolvedValue([
      { ...training, id: "training-z", title: "Zulu" },
      { ...training, id: "training-a", title: "Alfa" },
    ]);

    render(
      <MemoryRouter>
        <AdminTrainingsPage />
      </MemoryRouter>,
    );

    await screen.findByRole("button", { name: "Capacitación" });
    fireEvent.click(screen.getByRole("button", { name: "Capacitación" }));

    const tableRows = screen.getAllByRole("row");
    expect(within(tableRows[1]!).getByText("Alfa")).toBeInTheDocument();
  });

  it("keeps module creation collapsed and filters a long compact list", async () => {
    const manyModules = Array.from({ length: 6 }, (_, index) => ({
      ...module,
      id: `module-${index + 1}`,
      title: index === 5 ? "Evaluación final" : `Módulo ${index + 1}`,
      order: index,
    }));
    vi.mocked(contentApi.listModules).mockResolvedValue(manyModules);

    render(
      <MemoryRouter>
        <AdminTrainingsPage />
      </MemoryRouter>,
    );
    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Abrir" }))[0]!,
    );

    expect(await screen.findByText("Evaluación final")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar módulo" }));
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar módulos"), {
      target: { value: "evaluación" },
    });
    expect(screen.getByText("Evaluación final")).toBeInTheDocument();
    expect(screen.queryByText("Módulo 1")).not.toBeInTheDocument();
  });
});

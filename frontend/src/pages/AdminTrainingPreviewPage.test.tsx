import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { contentApi } from "../api/content";
import { videosApi } from "../api/videos";
import { AdminTrainingPreviewPage } from "./AdminTrainingPreviewPage";

vi.mock("../api/content", () => ({
  contentApi: {
    getTraining: vi.fn(),
    listModules: vi.fn(),
  },
}));

vi.mock("../api/videos", () => ({
  videosApi: { list: vi.fn() },
}));

describe("AdminTrainingPreviewPage", () => {
  beforeEach(() => {
    vi.mocked(contentApi.getTraining).mockResolvedValue({
      id: "training-1",
      title: "Seguridad corporativa",
      description: "Capacitación anual",
      status: "DRAFT",
      createdAt: "2026-07-18T00:00:00.000Z",
      updatedAt: "2026-07-18T00:00:00.000Z",
      createdBy: "admin",
      moduleIds: ["module-1"],
    });
    vi.mocked(contentApi.listModules).mockResolvedValue([
      {
        id: "module-1",
        trainingId: "training-1",
        title: "Introducción",
        order: 0,
        videoIds: ["video-1"],
        createdAt: "2026-07-18T00:00:00.000Z",
        updatedAt: "2026-07-18T00:00:00.000Z",
      },
    ]);
    vi.mocked(videosApi.list).mockResolvedValue([
      {
        id: "video-1",
        moduleId: "module-1",
        title: "Conceptos esenciales",
        originalFilename: "conceptos.mp4",
        storedFilename: "00000000-0000-4000-8000-000000000001.mp4",
        mimeType: "video/mp4",
        fileSize: 2_048,
        duration: 125,
        order: 0,
        status: "READY",
        createdAt: "2026-07-18T00:00:00.000Z",
        updatedAt: "2026-07-18T00:00:00.000Z",
        uploadedBy: "admin",
      },
    ]);
  });

  it("renders the learner-like outline and opens a ready video preview", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/trainings/training-1/preview"]}>
        <Routes>
          <Route
            path="/admin/trainings/:trainingId/preview"
            element={<AdminTrainingPreviewPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Seguridad corporativa" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Conceptos esenciales")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reproducir" }));
    expect(document.querySelector("video")).toBeInTheDocument();
  });
});

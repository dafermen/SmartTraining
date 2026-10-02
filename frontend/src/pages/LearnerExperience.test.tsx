import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assignmentsApi } from "../api/assignments";
import { contentApi } from "../api/content";
import { progressApi } from "../api/progress";
import { VideoPlayer } from "../features/videos/VideoPlayer";
import type { TrainingVideo } from "../types/api";
import { LearnerCatalogPage } from "./LearnerCatalogPage";

vi.mock("../api/content", () => ({
  contentApi: { listTrainings: vi.fn() },
}));
vi.mock("../api/assignments", () => ({
  assignmentsApi: { mine: vi.fn() },
}));
vi.mock("../api/progress", () => ({
  progressApi: { forTraining: vi.fn(), updateVideo: vi.fn() },
}));

describe("learner experience", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows published training progress and its primary action", async () => {
    vi.mocked(assignmentsApi.mine).mockResolvedValue([
      {
        id: "50000000-0000-4000-8000-000000000001",
        userId: "seed-learner",
        trainingId: "10000000-0000-4000-8000-000000000001",
        assignedBy: "seed-admin",
        assignedAt: "2026-09-01T00:00:00.000Z",
        dueDate: null,
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    ]);
    vi.mocked(contentApi.listTrainings).mockResolvedValue([
      {
        id: "10000000-0000-4000-8000-000000000001",
        title: "Seguridad corporativa",
        description: "Curso obligatorio",
        status: "PUBLISHED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "admin",
        moduleIds: [],
      },
    ]);
    vi.mocked(progressApi.forTraining).mockResolvedValue({
      records: [],
      summary: {
        totalVideos: 4,
        startedVideos: 1,
        completedVideos: 1,
        percentage: 25,
      },
    });

    render(
      <MemoryRouter>
        <LearnerCatalogPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Seguridad corporativa"),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 de 4 videos · 25%/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /continuar capacitación/i }),
    ).toHaveAttribute(
      "href",
      "/learn/trainings/10000000-0000-4000-8000-000000000001",
    );
  });

  it("uses protected media URLs and resumes at the saved position", () => {
    const video: TrainingVideo = {
      id: "30000000-0000-4000-8000-000000000001",
      moduleId: "20000000-0000-4000-8000-000000000001",
      title: "Introducción",
      originalFilename: "intro.mp4",
      storedFilename: "30000000-0000-4000-8000-000000000001.mp4",
      mimeType: "video/mp4",
      fileSize: 1000,
      duration: 100,
      order: 0,
      status: "READY",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uploadedBy: "admin",
    };
    const { container } = render(
      <VideoPlayer
        initialProgress={{
          id: "40000000-0000-4000-8000-000000000001",
          userId: "learner",
          trainingId: "10000000-0000-4000-8000-000000000001",
          moduleId: video.moduleId,
          videoId: video.id,
          currentTime: 42,
          duration: 100,
          percentage: 42,
          status: "IN_PROGRESS",
          startedAt: new Date().toISOString(),
          lastViewedAt: new Date().toISOString(),
        }}
        video={video}
      />,
    );
    const player = container.querySelector("video")!;
    Object.defineProperty(player, "duration", {
      configurable: true,
      value: 100,
    });
    fireEvent.loadedMetadata(player);

    expect(player.currentTime).toBe(42);
    expect(player).toHaveAttribute("src", `/api/videos/${video.id}/stream`);
    expect(screen.getByText(/42% visto/)).toBeInTheDocument();
  });
});

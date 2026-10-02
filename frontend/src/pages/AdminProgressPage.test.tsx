import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { progressApi } from "../api/progress";
import { AdminProgressPage } from "./AdminProgressPage";

vi.mock("../api/progress", () => ({
  progressApi: { adminList: vi.fn(), resetVideo: vi.fn() },
}));

describe("AdminProgressPage responsive presentation", () => {
  beforeEach(() => {
    vi.mocked(progressApi.resetVideo).mockResolvedValue();
    vi.mocked(progressApi.adminList).mockResolvedValue([
      {
        id: "progress-id",
        userId: "learner-id",
        trainingId: "training-id",
        moduleId: "module-id",
        videoId: "video-id",
        currentTime: 90,
        duration: 100,
        percentage: 90,
        status: "COMPLETED",
        startedAt: "2026-07-17T00:00:00.000Z",
        lastViewedAt: "2026-07-17T01:00:00.000Z",
        completedAt: "2026-07-17T01:00:00.000Z",
        userDisplayName: "Participante de demostración",
        username: "learner",
        trainingTitle: "Seguridad corporativa",
        videoTitle: "Introducción",
      },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("provides mobile cards while preserving the desktop table", async () => {
    render(<AdminProgressPage />);

    expect(
      await screen.findByRole("region", { name: "Progreso" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByText("Participante de demostración")).toHaveLength(2);
    expect(screen.getAllByText("90%")).toHaveLength(2);
  });

  it("confirms and resets only the selected participant video", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminProgressPage />);

    const actions = await screen.findAllByRole("button", {
      name: "Reiniciar Introducción para Participante de demostración",
    });
    fireEvent.click(actions[0]);

    await waitFor(() =>
      expect(progressApi.resetVideo).toHaveBeenCalledWith(
        "learner-id",
        "video-id",
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByText("Participante de demostración"),
      ).not.toBeInTheDocument(),
    );
  });
});

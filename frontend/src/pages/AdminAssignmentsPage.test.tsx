import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assignmentsApi } from "../api/assignments";
import { contentApi } from "../api/content";
import { usersApi } from "../api/users";
import { useToast } from "../contexts/ToastContext";
import { AdminAssignmentsPage } from "./AdminAssignmentsPage";

vi.mock("../api/assignments", () => ({
  assignmentsApi: {
    list: vi.fn(),
    create: vi.fn(),
    updateDueDate: vi.fn(),
    remove: vi.fn(),
  },
}));
vi.mock("../api/content", () => ({
  contentApi: { listTrainings: vi.fn() },
}));
vi.mock("../api/users", () => ({
  usersApi: { list: vi.fn() },
}));
vi.mock("../contexts/ToastContext", () => ({ useToast: vi.fn() }));

describe("AdminAssignmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ notify: vi.fn() });
    vi.mocked(usersApi.list).mockResolvedValue([
      {
        id: "seed-learner",
        username: "learner",
        displayName: "Participante de demostración",
        role: "LEARNER",
        active: true,
        createdAt: "2026-07-17T00:00:00.000Z",
        updatedAt: "2026-07-17T00:00:00.000Z",
      },
    ]);
    vi.mocked(contentApi.listTrainings).mockResolvedValue([
      {
        id: "10000000-0000-4000-8000-000000000001",
        title: "Seguridad corporativa",
        description: "Curso obligatorio",
        status: "PUBLISHED",
        createdAt: "2026-07-17T00:00:00.000Z",
        updatedAt: "2026-07-17T00:00:00.000Z",
        createdBy: "seed-admin",
        moduleIds: [],
      },
    ]);
    vi.mocked(assignmentsApi.list).mockResolvedValue([
      {
        id: "50000000-0000-4000-8000-000000000001",
        userId: "seed-learner",
        trainingId: "10000000-0000-4000-8000-000000000001",
        assignedBy: "seed-admin",
        assignedAt: "2026-07-17T00:00:00.000Z",
        dueDate: "2026-08-01",
        updatedAt: "2026-07-17T00:00:00.000Z",
        userDisplayName: "Participante de demostración",
        username: "learner",
        userActive: true,
        trainingTitle: "Seguridad corporativa",
        trainingStatus: "PUBLISHED",
      },
    ]);
  });

  it("shows searchable assignments with their due state", async () => {
    render(<AdminAssignmentsPage />);

    expect(
      await screen.findByRole("heading", { name: "Asignaciones" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Seguridad corporativa")).not.toHaveLength(0);
    expect(
      screen.getByRole("searchbox", { name: /buscar asignaciones/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Vencida")).not.toHaveLength(0);
  });
});

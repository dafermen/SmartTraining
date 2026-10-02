import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { videosApi } from "../api/videos";
import { AdminVideosPage } from "./AdminVideosPage";

vi.mock("../api/videos", () => ({
  videosApi: {
    list: vi.fn(),
    upload: vi.fn(),
    update: vi.fn(),
    retry: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
    replaceThumbnail: vi.fn(),
    previewUrl: vi.fn(),
  },
}));

describe("AdminVideosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(videosApi.list).mockResolvedValue([]);
  });

  it("shows an explicit upload form for the selected module", async () => {
    render(
      <MemoryRouter
        initialEntries={["/admin/modules/module-1/videos?title=Introducción"]}
      >
        <Routes>
          <Route
            path="/admin/modules/:moduleId/videos"
            element={<AdminVideosPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Introducción" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /cargar videos/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/seleccionar o arrastrar videos/i),
    ).toBeInTheDocument();
  });

  it("uploads multiple selected videos sequentially with derived titles", async () => {
    vi.mocked(videosApi.upload).mockImplementation(
      async (_moduleId, input, onProgress) => {
        onProgress(100);
        return {
          id: `video-${input.file.name}`,
          moduleId: "module-1",
          title: input.title,
          description: input.description,
          originalFilename: input.file.name,
          storedFilename: `${input.file.name === "primer-video.mp4" ? "00000000-0000-4000-8000-000000000001" : "00000000-0000-4000-8000-000000000002"}.mp4`,
          mimeType: "video/mp4",
          fileSize: input.file.size,
          order: 0,
          status: "PROCESSING",
          createdAt: "2026-07-18T00:00:00.000Z",
          updatedAt: "2026-07-18T00:00:00.000Z",
          uploadedBy: "admin",
        };
      },
    );

    render(
      <MemoryRouter
        initialEntries={["/admin/modules/module-1/videos?title=Seguridad"]}
      >
        <Routes>
          <Route
            path="/admin/modules/:moduleId/videos"
            element={<AdminVideosPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const firstFile = new File(["first"], "primer-video.mp4", {
      type: "video/mp4",
    });
    const secondFile = new File(["second"], "segundo_video.mp4", {
      type: "video/mp4",
    });
    fireEvent.change(screen.getByLabelText(/seleccionar o arrastrar videos/i), {
      target: { files: [firstFile, secondFile] },
    });

    expect(
      screen.getByRole("button", { name: "Cargar 2 videos" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("primer video")).toBeInTheDocument();
    expect(screen.getByDisplayValue("segundo video")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cargar 2 videos" }));

    await waitFor(() => expect(videosApi.upload).toHaveBeenCalledTimes(2));
    expect(vi.mocked(videosApi.upload).mock.calls[0]?.[1].title).toBe(
      "primer video",
    );
    expect(vi.mocked(videosApi.upload).mock.calls[1]?.[1].title).toBe(
      "segundo video",
    );
  });

  it("shows the processing reason and allows an administrator to retry", async () => {
    vi.mocked(videosApi.list).mockResolvedValue([
      {
        id: "video-1",
        moduleId: "module-1",
        title: "Video de seguridad",
        originalFilename: "seguridad.mp4",
        storedFilename: "00000000-0000-4000-8000-000000000001.mp4",
        mimeType: "video/mp4",
        fileSize: 1_024,
        order: 0,
        status: "ERROR",
        processingError: "FFmpeg no pudo generar la miniatura",
        createdAt: "2026-07-17T00:00:00.000Z",
        updatedAt: "2026-07-17T00:00:00.000Z",
        uploadedBy: "admin",
      },
    ]);
    vi.mocked(videosApi.retry).mockResolvedValue({
      ...(await videosApi.list("module-1"))[0]!,
      status: "PROCESSING",
      processingError: undefined,
    });

    render(
      <MemoryRouter
        initialEntries={["/admin/modules/module-1/videos?title=Seguridad"]}
      >
        <Routes>
          <Route
            path="/admin/modules/:moduleId/videos"
            element={<AdminVideosPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("FFmpeg no pudo generar la miniatura"),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /reintentar procesamiento/i }),
    );
    await waitFor(() =>
      expect(videosApi.retry).toHaveBeenCalledWith("video-1"),
    );
  });

  it("shows a visual video card and reveals secondary actions on demand", async () => {
    vi.mocked(videosApi.list).mockResolvedValue([
      {
        id: "video-ready",
        moduleId: "module-1",
        title: "Uso seguro de herramientas",
        description: "Práctica guiada",
        originalFilename: "herramientas.mp4",
        storedFilename: "00000000-0000-4000-8000-000000000003.mp4",
        mimeType: "video/mp4",
        fileSize: 2_097_152,
        duration: 125,
        order: 0,
        status: "READY",
        createdAt: "2026-07-18T00:00:00.000Z",
        updatedAt: "2026-07-18T00:00:00.000Z",
        uploadedBy: "admin",
      },
    ]);

    render(
      <MemoryRouter
        initialEntries={["/admin/modules/module-1/videos?title=Seguridad"]}
      >
        <Routes>
          <Route
            path="/admin/modules/:moduleId/videos"
            element={<AdminVideosPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("img", {
        name: "Miniatura de Uso seguro de herramientas",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("2:05")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Más acciones para Uso seguro de herramientas",
      }),
    );
    expect(
      screen.getByRole("menuitem", { name: "Editar información" }),
    ).toBeInTheDocument();
  });
});

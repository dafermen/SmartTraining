import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { documentationApi } from "../api/documentation";
import { DocumentationPage } from "./DocumentationPage";

vi.mock("../api/documentation", () => ({
  documentationApi: { list: vi.fn(), get: vi.fn() },
}));

const documents = [
  {
    id: "12-user-manual",
    title: "Manual del participante",
    description: "Aprender a realizar capacitaciones",
    category: "Manuales y aprendizaje",
    audience: "ALL" as const,
  },
  {
    id: "21-glossary",
    title: "Glosario",
    description: "Conceptos frecuentes",
    category: "Referencia y planificación",
    audience: "ALL" as const,
  },
];

describe("DocumentationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(documentationApi.list).mockResolvedValue(documents);
  });

  it("lists authorized documents and filters the catalog", async () => {
    render(
      <MemoryRouter initialEntries={["/docs"]}>
        <Routes>
          <Route path="/docs" element={<DocumentationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findAllByText("Manual del participante"),
    ).not.toHaveLength(0);
    expect(
      screen.getByRole("combobox", { name: /documento/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Glosario")).not.toHaveLength(0);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "capacitaciones" },
    });
    expect(screen.queryByText("Glosario")).not.toBeInTheDocument();
    expect(screen.getAllByText("Manual del participante")).not.toHaveLength(0);
  });

  it("renders headings, tables, code and a table of contents without raw HTML", async () => {
    vi.mocked(documentationApi.get).mockResolvedValue({
      ...documents[0],
      content: `# Manual del participante

## Primer paso

| Acción | Resultado |
| --- | --- |
| Entrar | Catálogo |

\`\`\`text
npm run dev
\`\`\`

<script>window.danger = true</script>`,
    });
    const { container } = render(
      <MemoryRouter initialEntries={["/docs/12-user-manual"]}>
        <Routes>
          <Route path="/docs/:documentId" element={<DocumentationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Primer paso" }),
    ).toHaveAttribute("id", "primer-paso");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("npm run dev")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Primer paso" })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: expect.stringContaining("#primer-paso"),
        }),
      ]),
    );
    expect(
      screen.getAllByRole("link", { name: /volver a la aplicación/i }),
    ).toHaveLength(2);
    expect(screen.getByRole("link", { name: /glosario →/i })).toHaveAttribute(
      "href",
      "/docs/21-glossary",
    );
    expect(container.querySelector("script")).toBeNull();
  });
});

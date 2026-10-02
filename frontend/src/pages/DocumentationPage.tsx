import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { documentationApi } from "../api/documentation";
import {
  headingId,
  MarkdownDocument,
} from "../features/documentation/MarkdownDocument";
import type { DocumentationDocument, DocumentationSummary } from "../types/api";

const DOCS_ROOT = "/docs";

const tableOfContents = (content: string) =>
  content
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      depth: match[1].length,
      title: match[2].replace(/[*_`]/g, ""),
      id: headingId(match[2].replace(/[*_`]/g, "")),
    }));

const quickLinkDefinitions = [
  { label: "Producto", documentIds: ["01-project-overview", "12-user-manual"] },
  { label: "Arquitectura", documentIds: ["04-architecture"] },
  { label: "Estado", documentIds: ["16-development-phases"] },
];

export function DocumentationPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentationSummary[]>([]);
  const [document, setDocument] = useState<DocumentationDocument>();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      documentationApi.list(),
      documentId
        ? documentationApi.get(documentId)
        : Promise.resolve(undefined),
    ])
      .then(([catalog, selected]) => {
        setDocuments(catalog);
        setDocument(selected);
      })
      .catch(() => setError("No pudimos cargar la documentación solicitada."))
      .finally(() => setLoading(false));
  }, [documentId]);

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return normalized
      ? documents.filter((item) =>
          `${item.title} ${item.description} ${item.category}`
            .toLocaleLowerCase("es")
            .includes(normalized),
        )
      : documents;
  }, [documents, query]);

  const grouped = filteredDocuments.reduce<
    Record<string, DocumentationSummary[]>
  >((categories, item) => {
    const current = categories[item.category] ?? [];
    return { ...categories, [item.category]: [...current, item] };
  }, {});
  const quickLinks = quickLinkDefinitions.flatMap((definition) => {
    const target = definition.documentIds
      .map((id) => documents.find((item) => item.id === id))
      .find(Boolean);
    return target ? [{ label: definition.label, target }] : [];
  });
  const currentIndex = documents.findIndex((item) => item.id === documentId);
  const previousDocument =
    currentIndex > 0 ? documents[currentIndex - 1] : undefined;
  const nextDocument =
    currentIndex >= 0 && currentIndex < documents.length - 1
      ? documents[currentIndex + 1]
      : undefined;
  const toc = document ? tableOfContents(document.content) : [];

  const quickNavigation = (
    <>
      <Link
        aria-current={!documentId ? "page" : undefined}
        className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-bold text-indigo-800 hover:bg-indigo-50"
        to={DOCS_ROOT}
      >
        Documentación
      </Link>
      {quickLinks.map(({ label, target }) => (
        <Link
          aria-current={documentId === target.id ? "page" : undefined}
          className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          key={label}
          to={`${DOCS_ROOT}/${target.id}`}
        >
          {label}
        </Link>
      ))}
    </>
  );

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="hidden items-center justify-between gap-4 lg:flex">
          <nav
            aria-label="Secciones de documentación"
            className="flex items-center gap-1"
          >
            {quickNavigation}
          </nav>
          <a
            className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
            href="/"
            target="_self"
          >
            ← Volver a la aplicación
          </a>
        </div>
        <details className="group lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 font-bold text-slate-800">
            Explorar documentación
            <span
              aria-hidden="true"
              className="text-indigo-700 group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <nav
            aria-label="Secciones de documentación móvil"
            className="grid gap-1 border-t border-slate-100 py-2"
          >
            {quickNavigation}
            <a
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
              href="/"
              target="_self"
            >
              ← Volver a la aplicación
            </a>
          </nav>
        </details>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-700">
            Centro de conocimiento
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
            Documentación SmartTraining
          </h1>
          <p className="mt-2 text-slate-600">
            Manuales, arquitectura y guías visibles según tu rol.
          </p>
        </div>
        <label className="w-full max-w-sm text-sm font-bold text-slate-700">
          Buscar documentos
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej. instalación, videos, seguridad"
            type="search"
            value={query}
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 p-4 text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-slate-600" role="status">
          Cargando documentación…
        </p>
      ) : null}

      {!loading && !error ? (
        <>
          <details className="group mb-4 rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 font-bold text-slate-800">
              {document?.title ?? "Seleccionar documento"}
              <span
                aria-hidden="true"
                className="text-indigo-700 group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <label className="block border-t border-slate-100 px-2 py-3 text-sm font-bold text-slate-700">
              Documento
              <select
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                onChange={(event) =>
                  navigate(
                    event.target.value
                      ? `${DOCS_ROOT}/${event.target.value}`
                      : DOCS_ROOT,
                  )
                }
                value={documentId ?? ""}
              >
                <option value="">Todos los documentos</option>
                {filteredDocuments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          </details>
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_240px]">
            <aside className="hidden self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-5 lg:block lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto">
              <Link
                aria-current={!documentId ? "page" : undefined}
                className={`block min-h-11 rounded-xl px-3 py-3 text-sm font-bold ${!documentId ? "bg-indigo-100 text-indigo-900" : "text-slate-700 hover:bg-slate-100"}`}
                to={DOCS_ROOT}
              >
                Todos los documentos
              </Link>
              {Object.entries(grouped).map(([category, items]) => (
                <section className="mt-5" key={category}>
                  <h2 className="px-3 text-xs font-black uppercase tracking-wider text-slate-400">
                    {category}
                  </h2>
                  <div className="mt-2 space-y-1">
                    {items?.map((item) => (
                      <Link
                        aria-current={
                          documentId === item.id ? "page" : undefined
                        }
                        className={`block min-h-11 rounded-lg px-3 py-2.5 text-sm leading-5 ${documentId === item.id ? "bg-indigo-700 font-bold text-white" : "text-slate-600 hover:bg-slate-100"}`}
                        key={item.id}
                        to={`${DOCS_ROOT}/${item.id}`}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
              {filteredDocuments.length === 0 ? (
                <p className="px-3 py-5 text-sm text-slate-500">
                  No hay coincidencias.
                </p>
              ) : null}
            </aside>

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-9">
              {document ? (
                <>
                  <nav
                    className="mb-5 text-sm text-slate-500"
                    aria-label="Migas de pan"
                  >
                    <Link
                      className="font-semibold text-indigo-700"
                      to={DOCS_ROOT}
                    >
                      Documentación
                    </Link>
                    <span aria-hidden="true"> / </span>
                    <span>{document.title}</span>
                  </nav>

                  {toc.length ? (
                    <details className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 xl:hidden">
                      <summary className="min-h-11 cursor-pointer py-2 font-bold text-indigo-950">
                        En esta página
                      </summary>
                      <nav
                        aria-label="Índice de esta página"
                        className="grid gap-1 pb-2"
                      >
                        {toc.map((item, index) => (
                          <a
                            className={`min-h-11 rounded-lg px-3 py-2 text-sm text-indigo-800 hover:bg-white ${item.depth === 3 ? "ml-3" : "font-semibold"}`}
                            href={`#${item.id}`}
                            key={`${item.id}-${index}`}
                          >
                            {item.title}
                          </a>
                        ))}
                      </nav>
                    </details>
                  ) : null}

                  <MarkdownDocument content={document.content} />

                  <nav
                    aria-label="Documentos anterior y siguiente"
                    className="mt-10 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-2"
                  >
                    {previousDocument ? (
                      <Link
                        className="min-h-14 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                        to={`${DOCS_ROOT}/${previousDocument.id}`}
                      >
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Anterior
                        </span>
                        <span className="mt-1 block font-bold text-indigo-800">
                          ← {previousDocument.title}
                        </span>
                      </Link>
                    ) : (
                      <span />
                    )}
                    {nextDocument ? (
                      <Link
                        className="min-h-14 rounded-xl border border-slate-200 p-4 text-right text-sm text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                        to={`${DOCS_ROOT}/${nextDocument.id}`}
                      >
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Siguiente
                        </span>
                        <span className="mt-1 block font-bold text-indigo-800">
                          {nextDocument.title} →
                        </span>
                      </Link>
                    ) : null}
                  </nav>
                </>
              ) : (
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Selecciona un documento
                  </h2>
                  <p className="mt-2 text-slate-600">
                    Tu biblioteca contiene {documents.length} documentos
                    autorizados.
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {filteredDocuments.map((item) => (
                      <Link
                        className="min-h-28 rounded-xl border border-slate-200 p-5 transition hover:border-indigo-400 hover:bg-indigo-50"
                        key={item.id}
                        to={`${DOCS_ROOT}/${item.id}`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                          {item.category}
                        </span>
                        <h3 className="mt-2 font-black text-slate-900">
                          {item.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <aside className="hidden self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-5 xl:block">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
                En esta página
              </h2>
              {toc.length ? (
                <nav
                  aria-label="Índice de esta página"
                  className="mt-3 space-y-1"
                >
                  {toc.map((item, index) => (
                    <a
                      className={`block min-h-10 rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 ${item.depth === 3 ? "ml-3" : "font-semibold"}`}
                      href={`#${item.id}`}
                      key={`${item.id}-${index}`}
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Abre un documento para ver su índice.
                </p>
              )}
            </aside>
          </div>
        </>
      ) : null}
    </main>
  );
}

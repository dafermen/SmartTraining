# Requerimientos no funcionales

- **RNF-SEC-01:** contraseñas con bcrypt; secretos por entorno; JWT mínimo y expirado.
- **RNF-SEC-02:** Helmet, CORS explícito, rate limit de login, validación y nombres aleatorios.
- **RNF-SEC-03:** medios fuera de contenido estático, autorización por solicitud y rutas físicas no reveladas.
- **RNF-DAT-01:** escrituras JSON serializadas, temporales, verificadas, atómicas y respaldadas.
- **RNF-PER-01:** streaming parcial sin cargar archivos completos en memoria.
- **RNF-PER-02:** progreso enviado por intervalo configurable, no cada segundo.
- **RNF-USA-01:** UI responsive, teclado, etiquetas visibles, foco y contraste WCAG 2.1 AA como meta.
- **RNF-MAN-01:** TypeScript estricto, módulos cohesionados y controladores sin acceso directo a JSON.
- **RNF-OBS-01:** logs estructurados sin credenciales/tokens y con código de error/contexto seguro.
- **RNF-TST-01:** lint, tipos, pruebas y build sin errores críticos antes de entrega.
- **RNF-DOC-01:** decisiones relevantes registran problema, alternativa, razón y limitación.
- **RNF-COM-01:** respuestas consistentes y errores sin stack en producción.
- **RNF-PORT-01:** desarrollo soportado en Windows, macOS y Linux con Node LTS y FFmpeg.

## Objetivos iniciales

- API CRUD p95 menor de 500 ms con datos demo en máquina local (excluye carga/procesamiento).
- Inicio de streaming p95 menor de 2 s en red local y archivo disponible.
- Cero secretos o videos confirmados al repositorio.
- Cobertura priorizada por riesgo; no se fija un porcentaje artificial en Fases 0–1.

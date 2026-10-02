# Fases de desarrollo

| Fase                            | Objetivo                                                 | Salida                              | Estado actual |
| ------------------------------- | -------------------------------------------------------- | ----------------------------------- | ------------- |
| 0 Definición                    | acordar problema, alcance y aceptación                   | visión y requisitos                 | COMPLETED     |
| 1 Arquitectura                  | diseñar capas, datos, medios, seguridad y documentación  | arquitectura y contratos            | COMPLETED     |
| 2 Configuración                 | crear proyectos y herramientas                           | frontend y backend compilables      | COMPLETED     |
| 3 Autenticación                 | implementar login, JWT, roles y rutas protegidas         | sesión segura                       | COMPLETED     |
| 4 Capacitaciones                | administrar capacitaciones, módulos, orden y publicación | gestión de contenido                | COMPLETED     |
| 5 Videos                        | cargar, procesar, generar miniaturas y transmitir videos | medios protegidos                   | COMPLETED     |
| 6 Participante                  | ofrecer catálogo, reproductor y progreso                 | recorrido del participante          | COMPLETED     |
| 7 Documentación                 | publicar guías técnicas y manuales operativos            | documentación integrada             | IN_PROGRESS   |
| 8 Pruebas                       | automatizar riesgos y validar responsive                 | suites y evidencia multidispositivo | IN_PROGRESS   |
| 9 Entrega del MVP               | revisar, demostrar y versionar el producto               | candidato de release                | IN_PROGRESS   |
| 10 Experiencia administrativa   | optimizar autoría, búsqueda, feedback y vista previa     | gestión visual guiada y accesible   | COMPLETED     |
| 11 Calidad previa al despliegue | formalizar y automatizar trece puertas de calidad        | evidencia reproducible por release  | IN_PROGRESS   |

## Estado de cierre

La documentación técnica, el despliegue y las guías operativas están alineados. Los manuales de administrador y participante continúan en validación hasta incorporar evidencia visual final.

Las pruebas unitarias, API, autenticación, permisos, carga, streaming y progreso están automatizadas. La comprobación responsive estructural también está cubierta, pero su aceptación final requiere ejecutar la matriz manual en teléfono, tableta y escritorio.

La entrega dispone de seed corporativo idempotente, guía de demostración, revisión de código y documentación, roadmap, limitaciones y notas de release. La versión permanece como candidata hasta validarla en el servidor y crear un tag desde un repositorio Git.

La continuidad entre sesiones se conserva mediante `CURRENT_STATUS.md`, fuente de relevo para distinguir el código local, el estado conocido de producción, la evidencia disponible y los bloqueantes abiertos.

La Fase 11 agrega trazabilidad para propiedades, mutation testing, fuzzing, E2E, seguridad dinámica, resiliencia, rendimiento y compatibilidad. Ya existe una base generativa y E2E; mutation testing, fuzzing dedicado, recorridos multimedia completos y las validaciones operativas permanecen abiertos.

Las tareas detalladas y sus criterios están en `backend/data/development-tasks.json`. Una tarea se marca completa solamente cuando existe evidencia suficiente para sus criterios de aceptación.

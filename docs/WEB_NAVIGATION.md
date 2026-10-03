# Navegación web de documentación · InnovaLogic v1

Actualización local: 2026-10-03. Entrada: `/docs/<id>`.

## Experiencia de lectura

Búsqueda por contenido exclusivamente sobre el catálogo autorizado. Carga acotada y protección frente a respuestas antiguas; copia, índice, tema y enlaces entre capítulos. El backend sigue filtrando por rol.

La documentación comparte azul `#2563eb`, cian `#0ea5e9`, superficies neutras y alternativa oscura. La aplicación conserva su propia identidad. Los colores son una base editable para la futura firma visual de InnovaLogic.

## Mantenimiento

Editar los tokens `--docs-accent`, `--docs-ink`, `--docs-muted` y las superficies en [frontend/src/features/documentation/innovalogic.css](../frontend/src/features/documentation/innovalogic.css); verificar ambos temas. Mantener Markdown como fuente y conservar identificadores/enlaces existentes. Agregar documentos solo al catálogo explícito: no rastrear carpetas privadas. No editar los artefactos generados.

## Evidencia y alcance

verify completo: 24 pruebas frontend y 41 backend; regresión de búsqueda autorizada; navegador con sesión LEARNER sintética en 1440/390 px. Se revisaron teclado, navegación móvil, búsqueda, copia y desbordamientos según los controles disponibles. Las pruebas de interfaz con datos sintéticos no sustituyen la validación del backend real ni una auditoría WCAG completa.

Esta revisión permanece local: no se ha publicado en GitHub ni desplegado. Se mantienen las exclusiones del portafolio y los bloqueos de producto o publicación anteriores. Siguiente paso: revisar el cambio y seguir el procedimiento de entrega del proyecto cuando corresponda.

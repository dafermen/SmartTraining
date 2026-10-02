# Revisión de documentación

## Correspondencia comprobada

- Los comandos raíz coinciden con `package.json`.
- Las rutas de frontend y API descritas corresponden con el código actual.
- El despliegue separa código privado en `app`, frontend público en `public_html` y datos persistentes en `/var/lib/smarttraining`.
- La guía de videos incluye límites de Nginx, permisos, FFmpeg y diagnóstico mediante logs.
- Los manuales reflejan búsqueda, filtros, carga múltiple, vista previa, progreso y navegación móvil.
- El seed documentado crea usuarios y contenido corporativo sin borrar contenido existente.
- El centro documental usa `/docs` como ruta canónica y conserva `/documentation` como redirección compatible.
- La navegación ofrece categorías basadas en documentos reales, búsqueda, estado activo, índice responsive y Anterior/Siguiente.
- El enlace “Volver a la aplicación” es nativo, apunta a `/` en la misma pestaña y no puede ser interceptado por el enrutado de Markdown.
- Los archivos de gobierno están en la raíz y los puntos de entrada técnicos permanecen en `docs/`.
- `npm run docs:check` valida archivos obligatorios, ubicaciones canónicas y enlaces Markdown relativos.

## Reglas para futuras actualizaciones

Todo cambio de endpoint, variable de entorno, ruta, permiso, almacenamiento o procedimiento operativo debe actualizar el documento correspondiente en el mismo cambio. Los manuales con evidencia visual permanecen en validación hasta incorporar capturas finales obtenidas en un navegador y un teléfono reales. La validación visual de `/docs`, modo oscuro y navegadores reales no debe darse por aprobada sin evidencia de la sesión.

## Resultado

La documentación técnica está alineada con el MVP y es suficiente para instalación, despliegue, diagnóstico y demostración. Queda como evidencia manual la revisión visual final indicada en los manuales y la guía de pruebas.

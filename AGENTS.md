# Instrucciones obligatorias para sesiones de desarrollo

Este archivo aplica a todo el repositorio. Antes de modificar el proyecto, lea también `CURRENT_STATUS.md` y el documento específico del área afectada en `docs/`.

## Contexto esencial

- SmartTraining tiene un frontend React/Vite en `frontend/` y una API Express/TypeScript en `backend/`.
- La persistencia usa SQLite para usuarios, asignaciones y auditoría; el contenido y progreso usan JSON atómico. Los videos y miniaturas son archivos privados.
- El comando integrado de desarrollo es `npm run dev:5175`; expone la interfaz en `http://127.0.0.1:5175` y la API en `http://127.0.0.1:3000`.
- El despliegue objetivo está documentado en `deploy/README.md` y `docs/DEPLOYMENT.md`.

## Reglas de trabajo

1. Preserve cambios y datos existentes que no pertenezcan a la tarea. No elimine contenido, videos, bases SQLite ni secretos locales.
2. No confirme `.env`, tokens, claves privadas, videos reales, bases SQLite, logs, reportes ni datos personales. Revise `.gitignore` antes de publicar.
3. Mantenga autenticación, autorización por rol y por asignación en el backend; ocultar botones en el frontend no es un control de seguridad.
4. Valide todas las entradas externas con los esquemas existentes y mantenga las rutas de medios confinadas a sus directorios privados.
5. Las escrituras JSON deben continuar siendo atómicas y una sola instancia debe acceder a esa persistencia en producción.
6. Todo cambio de contrato, flujo o seguridad debe actualizar pruebas y documentación en la misma entrega.
7. Mantenga `CURRENT_STATUS.md` verificable: fecha, funcionalidades, resultados reales, bloqueos y siguiente paso.
8. No declare una versión lista para producción mientras alguna de las trece puertas de `docs/TESTING.md` esté `BLOCKED` o carezca de evidencia/justificación `N/A` aprobada.

## Validación mínima

Para cambios ordinarios ejecute:

```bash
npm run verify
```

Antes de una publicación o despliegue ejecute además:

```bash
npm run predeploy:core
```

Complete las validaciones manuales y avanzadas en `test/pre-deployment-evidence-template.md`; el comando automatizado no sustituye esas evidencias.

## Documentación y continuidad

- La documentación canónica comienza en `README.md` y `docs/README.md`.
- Use `npm run docs:check` para detectar archivos desplazados y enlaces relativos rotos.
- Las capturas públicas se regeneran con `npm run docs:screenshots` mientras `npm run dev:5175` está activo. No capture la pantalla de login ni contenido sensible.
- Registre cambios relevantes en `CHANGELOG.md` y decisiones arquitectónicas en `docs/adr/`.
- Si una tarea queda incompleta, descríbala expresamente en `CURRENT_STATUS.md`; no la presente como terminada.

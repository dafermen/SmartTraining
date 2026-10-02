# Pruebas E2E

Playwright ejecuta una base automatizada en Chromium para escritorio y móvil.

```bash
npm run test:e2e
```

La configuración levanta temporalmente la API en `3000` y el frontend en `5176`. El seed de desarrollo es idempotente y garantiza las cuentas de demostración antes de iniciar el navegador.

## Cobertura actual

- Redirección de una ruta protegida hacia el login.
- Login de participante.
- Login y enrutamiento del administrador.
- Acceso autorizado al centro documental.
- Visibilidad del manual del participante.
- Cierre de sesión.
- Ejecución con viewport de escritorio y teléfono.

Los resultados se guardan en `playwright-report/` y los artefactos de fallos en `test-results/playwright/`; ambas rutas están ignoradas por Git.

Esta base no completa todavía toda la puerta E2E: faltan autoría/publicación, carga y reproducción de video, reanudación y reinicio administrativo de progreso.

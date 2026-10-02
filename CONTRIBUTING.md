# Contribuir a SmartTraining

1. Cree una rama desde `main`: `git switch -c tipo/descripcion-corta`.
2. Mantenga cada cambio enfocado y actualice documentación y tablero.
3. Ejecute `npm run verify`.
4. Use commits claros, por ejemplo `feat(trainings): add create endpoint`.
5. Abra un pull request con propósito, pruebas, riesgos y capturas si cambia la UI.

No incluya secretos, `.env`, videos reales ni datos personales. Los cambios de contrato deben actualizar `docs/08-api-documentation.md` y `docs/09-data-model.md`.

Un pull request destinado a producción debe completar la plantilla y las trece puertas de `docs/TESTING.md`. Un resultado `BLOCKED` impide desplegar; `N/A` exige justificación explícita.

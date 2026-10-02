# Estructura de carpetas

```text
SmartTraining/
├── .github/           # CI, Dependabot y plantillas
├── CURRENT_STATUS.md  # relevo: estado, validaciones y próximos pasos
├── frontend/
│   └── src/{api,assets,components,constants,contexts,features,hooks,layouts,pages,routes,services,types,utils}
├── backend/
│   ├── src/{config,constants,controllers,errors,middleware,repositories,routes,services,types,utils,validators}
│   ├── data/
│   ├── scripts/
│   ├── storage/{videos,thumbnails}/
│   └── tests/
├── docs/
├── deploy/
├── test/              # clasificación y evidencia previa al despliegue
├── THIRD_PARTY_LICENSES.md
└── package.json
```

En Fases 0–1 se crean documentación, almacenamiento vacío y contratos JSON. Los proyectos npm y fuentes ejecutables corresponden a Fase 2.

## Convenciones

- Un dominio contiene componentes/hooks específicos; `components` aloja UI realmente compartida.
- Controladores terminan en `.controller.ts`, servicios en `.service.ts` y repositorios en `.repository.ts`.
- Pruebas unitarias se ubican junto al código o en `tests/unit`; pruebas HTTP en `backend/tests/integration`.
- Los videos nunca se colocan en `frontend/public` ni se sirven con `express.static`.

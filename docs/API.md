# API

El contrato REST canónico se mantiene en [08-api-documentation.md](08-api-documentation.md).

## Reglas

- Base pública: `/api`.
- Autenticación y autorización se aplican en backend.
- Entradas externas se validan con Zod.
- Respuestas exitosas usan `{ success, message, data }`.
- Errores usan el manejador central y un `errorCode` estable.
- Cualquier cambio de ruta, cuerpo, rol, código HTTP o respuesta requiere actualizar el contrato y sus pruebas.

Las pruebas de contrato se ejecutan con:

```bash
npm run test:contract
```

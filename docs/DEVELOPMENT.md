# Desarrollo

## Inicio

1. Leer `../CURRENT_STATUS.md` y contrastar su estado con el código.
2. Usar Node.js 24.15 o superior.
3. Instalar las dependencias de los tres paquetes:

   ```bash
   npm ci
   npm ci --prefix frontend
   npm ci --prefix backend
   ```

4. En Windows usar `npm.cmd` si PowerShell bloquea `npm.ps1`.

## Flujo de trabajo

1. Confirmar el comportamiento actual en código y pruebas.
2. Implementar el corte más pequeño que cumpla el criterio.
3. Añadir casos positivos, negativos y de permisos.
4. Ejecutar `npm run verify`.
5. Actualizar contrato, manual, changelog, tablero y `CURRENT_STATUS.md`.

## Convenciones

- Frontend: React y TypeScript bajo `frontend/src`.
- Backend: controladores, servicios y repositorios bajo `backend/src`.
- Usuarios y auditoría: SQLite.
- Contenido y progreso: JSON validado con escrituras atómicas y serializadas.
- Medios: almacenamiento privado; nunca `frontend/public`.

Consulte [instalación](06-installation-guide.md), [estructura](05-folder-structure.md), [pruebas](TESTING.md) y [contribución](../CONTRIBUTING.md).

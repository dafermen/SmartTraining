# 0001 — Persistencia híbrida local

- Estado: Accepted
- Fecha: 2026-07-18

## Contexto

El MVP necesita identidades seguras, auditoría administrativa, contenido estructurado y medios privados en una sola instancia de bajo costo.

## Decisión

Usar SQLite para usuarios y auditoría; JSON validado con escrituras atómicas para contenido y progreso; y disco privado para videos y miniaturas.

## Consecuencias

- La identidad obtiene restricciones, consultas parametrizadas, WAL y auditoría.
- El contenido sigue siendo sencillo de inspeccionar y respaldar.
- Solo puede operar una instancia de la API sobre esos JSON.
- El escalado horizontal exige migrar contenido y medios a servicios compartidos.
- El backup consistente debe abarcar toda la carpeta persistente.

## Alternativas consideradas

- Todo en JSON: descartado para credenciales y auditoría.
- Base relacional completa: diferida hasta que concurrencia, consultas o escalado lo justifiquen.
- Almacenamiento de objetos: diferido hasta necesitar múltiples instancias o distribución geográfica.

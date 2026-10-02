# Visión y alcance del proyecto

## Problema

Las empresas necesitan distribuir capacitaciones en video, mantener el contenido organizado y conocer el avance sin depender de enlaces públicos ni de una infraestructura compleja para un piloto.

## Visión

SmartTraining será una aplicación web corporativa, accesible y educativa donde un administrador prepara contenido y un participante lo consume de forma segura, reanudable y medible.

## Objetivos medibles del MVP

- Administrar la jerarquía capacitación → módulos → videos.
- Restringir creación y seguimiento agregado al rol `ADMIN`.
- Servir videos y miniaturas únicamente después de autenticar y autorizar.
- Conservar posición, porcentaje y finalización por participante.
- Poder instalar el proyecto siguiendo solamente el README.
- Mantener documentación y tablero como parte del producto.

## Alcance incluido

Autenticación, roles, capacitaciones, módulos, videos, FFmpeg, streaming Range, progreso, asignaciones individuales con fecha límite, documentación Markdown, tablero de desarrollo, datos demo, interfaz responsive y pruebas críticas.

## Fuera de alcance

Evaluaciones, certificados, recuperación de contraseña, SSO, organizaciones múltiples, asignaciones masivas por grupo/departamento, notificaciones, SCORM, nube, PostgreSQL, analítica avanzada y auditoría completa.

## Actores

- **ADMIN:** configura contenido, asigna capacitaciones, consulta progreso y gobierna documentación/tablero.
- **LEARNER:** consume contenido publicado que tiene asignado y consulta su progreso/manual.

## Supuestos y restricciones

- Despliegue de instancia única con disco persistente.
- Navegadores modernos con soporte HTML5 video.
- FFmpeg instalado por el operador.
- JSON es una decisión temporal del MVP, no una base para alta concurrencia.

## Éxito

El MVP se acepta con los criterios de `24-mvp-acceptance-criteria.md`; las métricas iniciales son tasa de reproducción exitosa, actualizaciones de progreso válidas y ausencia de acceso cruzado por rol.

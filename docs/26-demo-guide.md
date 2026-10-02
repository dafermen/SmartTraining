# Guía de demostración

Esta guía permite presentar SmartTraining de forma reproducible sin depender de videos o información privada.

## Preparación

1. Instale dependencias y configure el entorno según la guía de instalación.
2. Ejecute `npm run seed`. El comando es idempotente: conserva el contenido existente y garantiza usuarios, una capacitación corporativa, tres módulos y su asignación a `learner`.
3. Ejecute `npm run dev` y abra `http://127.0.0.1:5173/login`.
4. Use un MP4 corto H.264/AAC sin datos confidenciales para demostrar la carga.

Usuarios locales:

| Rol           | Usuario   | Contraseña de demostración |
| ------------- | --------- | -------------------------- |
| Administrador | `admin`   | `comillas22`               |
| Participante  | `learner` | `comillas22`               |

## Recorrido del administrador

1. Inicie sesión como `admin` y abra **Capacitaciones**.
2. Localice **Seguridad y salud en el trabajo** usando la búsqueda y el filtro de estado.
3. Revise sus tres módulos y explique el orden del contenido.
4. Entre a **Videos**, seleccione uno o varios archivos y muestre el progreso de la cola.
5. Espere el estado `Listo`; abra la vista previa protegida y compruebe miniatura y reproducción.
6. Regrese a la capacitación, abra **Vista previa** y revise la experiencia antes de publicar.
7. Publique la capacitación y confirme la notificación de éxito.
8. Abra **Asignaciones**, confirme que `learner` tiene acceso y muestre cómo agregar o cambiar una fecha límite.

## Recorrido del participante

1. Cierre sesión e ingrese como `learner`.
2. Abra la capacitación publicada desde **Mis capacitaciones**.
3. Reproduzca un video, avance parte del contenido y pause.
4. Vuelva al catálogo y abra nuevamente el video para mostrar la reanudación.
5. Supere el 80 % y confirme el estado **Completado**.

## Cierre administrativo

1. Regrese como `admin` y abra **Progreso**.
2. Confirme participante, capacitación, porcentaje, estado y última actividad.
3. Abra **Documentación** para mostrar manuales y referencia técnica integrada.
4. Explique las limitaciones actuales usando el documento de riesgos.

## Criterio de demostración exitosa

La demo termina correctamente cuando el administrador carga, publica y asigna contenido, el participante reproduce y guarda progreso, y el administrador observa ese progreso. No use los archivos reales de producción ni copie `/var/lib/smarttraining` para preparar una demo.

# Manual del administrador

## Iniciar sesión

1. Abra la dirección que muestra `npm run dev`; normalmente es `http://127.0.0.1:5173/login`.
2. Ingrese las credenciales administrativas asignadas. En desarrollo: `admin` / `comillas22`.
3. El sistema abre el panel administrativo en `/admin`.

En escritorio, el encabezado mantiene el acceso a **Panel**, **Capacitaciones**, **Usuarios**, **Asignaciones**, **Progreso**, **Documentación** y **Cerrar sesión**. En teléfono, el encabezado conserva la marca y **Salir**, mientras una barra fija inferior presenta **Panel**, **Cursos**, **Progreso**, **Usuarios** y **Ayuda** con áreas táctiles amplias. En móvil, **Asignaciones** permanece disponible desde la tarjeta principal del panel.

## Recorrer el panel

El panel ofrece cuatro accesos principales:

- **Administrar contenido** abre el flujo de capacitaciones, módulos y videos.
- **Administrar usuarios** permite crear cuentas y controlar sus accesos.
- **Asignar capacitaciones** decide qué cursos recibe cada participante y sus fechas límite.
- **Ver progreso** abre el seguimiento de participantes.

El logo o la opción **Panel** regresan al inicio administrativo desde cualquier pantalla protegida.

La tabla superior de capacitaciones incluye búsqueda por título o descripción, filtro por estado, columnas ordenables y paginación. El contador muestra resultados visibles sobre el total; **Limpiar filtros** restaura la lista completa. En teléfono, los mismos registros se presentan como tarjetas compactas paginadas.

## Crear y publicar una capacitación

1. Abra **Capacitaciones** en la navegación superior o **Cursos** en la barra móvil.
2. Complete título y descripción y seleccione **Crear capacitación**.
3. La pantalla inicia sin selección. Utilice **Abrir** en la tabla para cargar la capacitación que desea administrar.
4. Seleccione **Agregar módulo** para desplegar el formulario y complete nombre y descripción opcional. Después de guardar, el formulario vuelve a plegarse.
5. Los módulos se muestran como filas compactas dentro de una lista con altura limitada. Cuando existen más de cuatro aparece una búsqueda por nombre o descripción.
6. Seleccione **Videos** para abrir el contenido del módulo, use las flechas para establecer el orden y abra `⋯` para editar información o eliminar.
7. Expanda la **Ruta de publicación** para comprobar información, módulos y videos. **Información general** también permanece resumida hasta que decida editarla.
8. Mantenga el estado `DRAFT` mientras prepara el contenido.
9. Publique únicamente cuando los videos obligatorios estén `READY` y haya comprobado su reproducción.

Una capacitación `DRAFT` o `ARCHIVED` no es visible para participantes. La publicación controla la visibilidad en el backend, no solamente en la interfaz.

Publicar no asigna automáticamente la capacitación. Después de publicarla, abra **Asignaciones** para entregarla a los participantes correspondientes.

Antes de publicar, seleccione **Vista previa**. Esta pantalla reproduce la estructura que recibirá el participante, muestra módulos, miniaturas y duraciones, y permite reproducir videos `READY`. Los elementos en procesamiento o con error aparecen como no disponibles.

## Cargar y verificar un video

1. Localice el módulo de destino y seleccione **Videos**.
2. Seleccione o arrastre uno o varios archivos MP4/WebM dentro del límite configurado.
3. Revise los títulos derivados de los nombres de archivo y agregue descripciones opcionales.
4. Seleccione **Cargar N videos**. La cola transfiere un archivo a la vez y muestra su progreso individual.
5. Si una transferencia falla, los demás elementos continúan. Corrija la causa y vuelva a iniciar la cola para reintentar los pendientes.
6. Cada video cambia de `PROCESSING` a `READY` cuando FFmpeg obtiene la duración, prepara el MP4 para reproducción web y genera la miniatura.
7. Use la vista previa protegida y confirme que el video inicia, permite avanzar y tiene audio cuando corresponde.
8. Use los controles de orden para definir la secuencia dentro del módulo.

Si el estado termina en `ERROR`, la pantalla muestra el motivo informado por el procesador. Corrija FFmpeg, formato, permisos o espacio disponible y seleccione **Reintentar procesamiento**; el archivo ya transferido se reutiliza. Elimine y vuelva a cargar solamente cuando el archivo original sea inválido. Puede reemplazar la miniatura desde la misma pantalla.

Cada video se presenta como una tarjeta con miniatura, duración, tamaño y estado. **Vista previa** es la acción principal de un video listo. Abra el menú **Más acciones (⋯)** para editar información, reemplazar la miniatura o eliminar; las flechas permanecen disponibles para ordenar con teclado o puntero.

Las operaciones exitosas muestran una notificación temporal en la parte superior. Los errores importantes permanecen además dentro de la página para conservar su contexto y acción de recuperación.

## Estados de contenido

| Estado       | Significado                 | Acción recomendada                       |
| ------------ | --------------------------- | ---------------------------------------- |
| `DRAFT`      | Capacitación en preparación | Completar módulos y videos               |
| `PUBLISHED`  | Visible para participantes  | Evitar cambios estructurales inesperados |
| `ARCHIVED`   | Retirada del catálogo       | Conservar para consulta administrativa   |
| `PROCESSING` | Video en análisis           | Esperar antes de publicar                |
| `READY`      | Video disponible            | Verificar la reproducción                |
| `ERROR`      | El procesamiento falló      | Corregir la causa y reintentar           |

## Consultar participantes

Abra **Progreso** o `/admin/progress`. La tabla muestra participante, capacitación, video, porcentaje, estado y última actividad. Un video se considera completado cuando alcanza el porcentaje configurado, inicialmente 80 %.

Para devolver un video al estado **No iniciado** para una sola persona, pulse **Reiniciar** en su fila y confirme la operación. Se elimina únicamente el registro de progreso de esa combinación participante-video; el archivo, los demás participantes y sus avances no cambian. La acción queda registrada en la auditoría administrativa como `VIDEO_PROGRESS_RESET`.

Para validar un recorrido de demostración:

1. Reproduzca parte de un video con el usuario `learner`.
2. Regrese como `admin` y abra **Progreso**.
3. Confirme que aparecen la posición, el porcentaje y la última actividad esperados.
4. Pulse **Reiniciar**, confirme y verifique que la fila desaparece porque el video vuelve a **No iniciado**.
5. Regrese como `learner` y confirme que ese video inicia desde cero mientras los demás avances permanecen intactos.

## Administrar usuarios

Abra **Usuarios** o `/admin/users`. La tabla permite buscar por nombre o usuario, filtrar por rol y estado, y recorrer resultados paginados.

1. Seleccione **Nuevo usuario** y complete nombre, usuario, rol y una contraseña temporal de 12 a 72 caracteres.
2. Confirme la contraseña y seleccione **Crear cuenta**. El usuario queda activo de inmediato.
3. Use **Editar** para cambiar nombre, rol o estado. Desactivar conserva el progreso, pero impide iniciar sesión.
4. Use **Contraseña** para establecer una clave nueva. Todas las sesiones anteriores de esa cuenta se invalidan automáticamente.
5. Abra **Ver actividad** para revisar altas, cambios de acceso y restablecimientos recientes.

El nombre de usuario no se edita después del alta. El sistema impide que un administrador se desactive o cambie su propio rol y nunca permite retirar el último administrador activo. No se eliminan cuentas porque pueden estar relacionadas con capacitaciones, videos o progreso. Si restablece su propia contraseña, deberá iniciar sesión de nuevo.

Las cuentas `admin` y `learner` permanecen como datos de desarrollo. En producción cambie sus contraseñas de demostración desde este módulo y no vuelva a ejecutar el seed.

## Asignar capacitaciones

Abra **Asignaciones** o `/admin/assignments` desde el encabezado de escritorio o la tarjeta del panel.

1. Seleccione un participante activo.
2. Seleccione una capacitación publicada que todavía no tenga asignada.
3. Agregue una fecha límite opcional y pulse **Asignar**.
4. Use búsqueda y el filtro de plazo para localizar asignaciones vencidas, próximas, en plazo o sin fecha.
5. Pulse **Fecha** para modificar o quitar el vencimiento.
6. Pulse **Retirar** para eliminar el acceso. El progreso anterior se conserva y reaparecerá si vuelve a asignar la capacitación.

No es posible duplicar la misma capacitación para una persona, asignar contenido en borrador/archivado ni asignar a administradores o cuentas inactivas. Alcanzar la fecha límite muestra el estado **Vencida**, pero no bloquea automáticamente el aprendizaje.

## Editar y eliminar contenido

- Puede editar el título y la descripción de una capacitación o módulo.
- Un módulo con videos no puede eliminarse hasta retirar sus videos.
- Una capacitación con videos tampoco puede eliminarse directamente.
- Eliminar un video también elimina su archivo, miniatura y progreso relacionado.
- Cada eliminación irreversible exige confirmación visible.

Antes de una limpieza importante, conserve una copia de la carpeta persistente de datos y medios con la API detenida. En producción es `/var/lib/smarttraining`.

## Documentación y cierre de sesión

Abra **Documentación**, ubicada junto a **Cerrar sesión**, para consultar arquitectura, API, seguridad, operación y guías. Estos documentos técnicos no son visibles para el rol participante.

Al terminar, seleccione **Cerrar sesión**. No cierre solamente la pestaña si el equipo es compartido.

## Evidencia visual pendiente

Para cerrar la validación documental se incorporarán capturas de:

1. Panel administrativo.
2. Creación y publicación de una capacitación.
3. Carga y vista previa de un video `READY`.
4. Tabla de progreso.

# Ro & Juli · Invitación de casamiento

Sitio estático, sin dependencias ni compilación. Publicar el contenido de `dist/`.

## Publicar en Vercel

El archivo `vercel.json` configura la publicación de `dist/`, sin instalación ni compilación.

1. Importar el repositorio en Vercel.
2. Elegir como **Root Directory** la carpeta que contiene este README y `vercel.json`: `ro-juli` si el repositorio contiene esa subcarpeta, o `.` si se subió directamente su contenido.
3. Usar **Framework Preset: Other**. La carpeta de salida es `dist`; los comandos de instalación y compilación quedan vacíos, según `vercel.json`.
4. Publicar. No hacen falta variables de entorno: la URL pública de Apps Script ya está en `dist/config.js`.

Si se usa la CLI, ejecutar `vercel` desde `ro-juli` para crear una vista previa.

Después de publicar, probar una confirmación desde la URL de Vercel y comprobar que aparezca en Sheets. Apps Script debe estar desplegado con acceso para todos, ejecutarse como propietario y devolver `{"ok":true}` tras guardar los datos. La prueba local `node check.mjs` simula el servicio externo; no confirma la escritura en la planilla ni los permisos del deployment.

Para cambiar la URL de Sheets, editar `dist/config.js` y volver a desplegar. Vercel sirve ese archivo con revalidación de caché.

## Editar los lugares y conectar Google Sheets

Editar `dist/config.js`. `ceremonyAddress` y `celebrationAddress` controlan las búsquedas de Google Maps. Verificar ambos lugares antes de compartir la invitación definitiva.

Completar `rsvpEndpoint` con la URL `/exec` del deployment público de Apps Script, ejecutado como propietario, accesible para todos sin iniciar sesión. El navegador envía POST con Content-Type `text/plain;charset=utf-8`, cuerpo JSON y sigue redirecciones. No utilizar `no-cors`: necesitamos verificar la respuesta antes de mostrar éxito.

Payload de ejemplo:

```json
{"ID del envío":"uuid","Nombre y apellido":"Nombre Apellido","Asistencia":true,"Cantidad de asistentes":2,"Restricciones alimentarias":"Sin gluten","Fecha y hora de envío":"2026-11-05T01:00:00.000Z"}
```

Usar esos mismos nombres como encabezados de la planilla. Si no asiste: `Asistencia: false`, `Cantidad de asistentes: 0`, `Restricciones alimentarias: ""`. El endpoint debe validar los datos y devolver JSON `{"ok":true}` únicamente cuando la fila ya esté guardada. Deduplicar por `ID del envío` (se conserva en reintentos del mismo formulario) para evitar duplicados si la respuesta de red se pierde. Habilitar la respuesta accesible desde el origen público y comprobar el flujo real desde el sitio publicado. No incluir tokens ni secretos en config.js.

Sin endpoint, el formulario muestra una vista previa con opción de copiar y aclara que no envió los datos. Si el envío falla o su respuesta no confirma `ok: true`, conserva los campos y ofrece copiar. No persiste datos personales en el navegador.

## Vista local

Desde esta carpeta: `python -m http.server 4173 --directory dist`. Abrir http://localhost:4173.

El calendario usa UTC (21:00 UTC = 18:00 en Argentina); el contador usa explícitamente UTC−3. El contenido se mantiene visible sin JavaScript. Las fuentes se sirven desde Google Fonts con fuentes de sistema como alternativa.

## Lugares consultados

- Parroquia San Pablo y San Juan Bosco, Rivadavia y Don Bosco, Mar del Plata: https://www.obispado-mdp.org.ar/a/parroquias/
- La Victoriana, Padre Luis Varetto 2500, Sierra de los Padres: https://www.lavictoriana.com.ar/

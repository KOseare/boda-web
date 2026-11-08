# Ro & Juli · Invitación de casamiento

Invitación sin dependencias ni compilación. Los archivos estáticos están en `dist/` y la recepción de confirmaciones usa la función `api/rsvp.mjs` de Vercel.

## Publicar en Vercel

El archivo `vercel.json` configura la publicación de `dist/`, sin instalación ni compilación.

1. Importar el repositorio en Vercel.
2. Elegir como **Root Directory** la carpeta que contiene este README y `vercel.json`: `ro-juli` si el repositorio contiene esa subcarpeta, o `.` si se subió directamente su contenido.
3. Usar **Framework Preset: Other**. La carpeta de salida es `dist`; los comandos de instalación y compilación quedan vacíos, según `vercel.json`.
4. Publicar el repositorio completo para incluir `api/`. No hacen falta variables de entorno: la URL pública de Apps Script está en `api/rsvp.mjs`.

Si se usa la CLI, ejecutar `vercel` desde `ro-juli` para crear una vista previa.

Después de publicar, probar una confirmación desde la URL de Vercel y comprobar que aparezca en Sheets. Apps Script debe estar desplegado con acceso para todos, ejecutarse como propietario y devolver `{"ok":true}` o `{"status":"success"}` tras guardar los datos. La prueba local `node check.mjs` simula el servicio externo; no confirma la escritura en la planilla ni los permisos del deployment.

Para cambiar la URL de Apps Script, editar `endpoint` en `api/rsvp.mjs` y volver a desplegar.

## Editar los lugares y conectar Google Sheets

Editar `dist/config.js`. `ceremonyAddress` y `celebrationAddress` controlan las búsquedas de Google Maps. Verificar ambos lugares antes de compartir la invitación definitiva.

Mantener `rsvpEndpoint: '/api/rsvp'` en `dist/config.js`. El navegador envía JSON a su propio dominio y la función de Vercel hace un único POST a Apps Script con `text/plain;charset=utf-8`, siguiendo redirecciones desde el servidor. Así el navegador no depende de CORS de Google. Apps Script debe estar ejecutado como propietario y accesible para todos sin iniciar sesión.

La función solo confirma éxito cuando Google devuelve JSON explícito de guardado. Si Google devuelve HTML, un error HTTP, un fallo de red o tarda más de 45 segundos, devuelve un error sin reintentar el POST. El navegador espera hasta 55 segundos; la función tiene un máximo de 60 segundos. Los logs registran la clase del fallo sin incluir nombres, restricciones alimentarias ni el cuerpo de la respuesta. Ejecutar `node check-rsvp.mjs` para probar estos casos con Google simulado, sin escribir filas reales.

Payload de ejemplo:

```json
{"ID del envío":"uuid","Nombre y apellido":"Nombre Apellido","Asistencia":true,"Cantidad de asistentes":2,"Restricciones alimentarias":"Sin gluten","Fecha y hora de envío":"2026-11-05T01:00:00.000Z"}
```

Usar esos mismos nombres como encabezados de la planilla. Si no asiste: `Asistencia: false`, `Cantidad de asistentes: 0`, `Restricciones alimentarias: ""`. El endpoint debe validar los datos y devolver JSON `{"ok":true}` o `{"status":"success"}` únicamente cuando la fila ya esté guardada. Deduplicar por `ID del envío` (se conserva en reintentos del mismo formulario) para evitar duplicados si la respuesta de red se pierde. En Apps Script usar `data['Asistencia'] ?? ''` para conservar el valor booleano `false`. Comprobar el flujo real desde el sitio publicado. No incluir tokens ni secretos en config.js.

Sin endpoint, el formulario muestra una vista previa con opción de copiar y aclara que no envió los datos. Si el envío falla o su respuesta no confirma `ok: true` o `status: "success"`, conserva los campos y ofrece copiar. No persiste datos personales en el navegador.

## Vista local

Desde esta carpeta: `python -m http.server 4173 --directory dist`. Abrir http://localhost:4173.

Ese servidor solo permite revisar la parte estática; no ejecuta `/api/rsvp`. Para probar confirmaciones usar Vercel, `vercel dev`, o las pruebas locales `node check.mjs` y `node check-rsvp.mjs`. Para una vista previa sin envío, vaciar temporalmente `rsvpEndpoint`.

El calendario usa UTC (21:00 UTC = 18:00 en Argentina); el contador usa explícitamente UTC−3. El contenido se mantiene visible sin JavaScript. Las fuentes se sirven desde Google Fonts con fuentes de sistema como alternativa.

## Lugares consultados

- Parroquia San Pablo y San Juan Bosco, Rivadavia y Don Bosco, Mar del Plata: https://www.obispado-mdp.org.ar/a/parroquias/
- La Victoriana, Padre Luis Varetto 2500, Sierra de los Padres: https://www.lavictoriana.com.ar/

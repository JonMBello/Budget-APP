# Despliegue propuesto (no ejecutado)

Destino: `https://budget.jonmb.com/app`, API `https://budget.jonmb.com/api`, Swagger `/api/docs`. La ruta BFF pública será `/app/bff`, distinta de `/api` reservado a NestJS.

Next.js requiere proceso Node por sus sesiones y handlers. Configurar `basePath: '/app'` en build; cambiarlo exige reconstruir. Servir `.next` como un sitio estático no soporta este diseño. Referencias: [basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath) y [self-hosting de Next.js](https://nextjs.org/docs/app/guides/self-hosting).

Ejemplo conceptual de Caddy, a completar con los puertos existentes del VPS; se usa 3000 para API (como el ejemplo de Budget-API) y 3003 para Next.js, ambos solo en loopback:

```caddyfile
budget.jonmb.com {
    encode zstd gzip

    @api path /api /api/*
    handle @api {
        reverse_proxy 127.0.0.1:3000
    }

    @app path /app /app/*
    handle @app {
        reverse_proxy 127.0.0.1:3003
    }

    handle / {
        redir /app 302
    }

    handle {
        respond "Not found" 404
    }
}
```

No usar handle_path, pues quitaría el prefijo esperado. Mantener API key en comunicación Next.js→API, no incrustarla en assets ni exponerla mediante un endpoint público. Validar configuración con la versión instalada de Caddy antes de reemplazar la activa.

## Ticket FE-01.5: procedimiento de implementación

1. Inventariar puertos, servicio API y Caddy actuales; preservar configuración y artefacto anterior.
2. Construir frontend con lockfile y basePath correcto. Configurar variables server-only, almacén de sesiones persistente y usuario de servicio sin privilegios.
3. Ejecutar Next.js bajo gestor de procesos/systemd con reinicio y healthcheck. API/MongoDB permanecen en sus servicios existentes.
4. Probar configuración en staging HTTPS, revisar redirecciones, cookies Path=/app, recursos, manifest y scope del service worker. Ninguna respuesta privada puede cachearse públicamente.
5. Validar Caddy y recargar configuración; smoke de rutas financieras con usuario sintético autorizado y prueba de restauración de sesión tras reinicio.
6. Rollback: restablecer artefacto de frontend y configuración previa; manejar compatibilidad de sesión y caché de service worker. No tocar datos financieros como parte del rollback de UI.

## Verificación de salida

- `/app/login`, enlaces profundos y `/app/_next/*` funcionan; `/api/docs` conserva su ruta.
- `/app/bff` exige sesión salvo endpoints locales de login/registro; acceso a ruta upstream arbitraria es rechazado.
- API caída produce estado de error y no balance cero. Reinicio del frontend no expone ni cruza sesiones.
- PWA instalada abre /app; manifest, iconos y /app/sw.js resuelven sin redirección al login.
- Logs del proxy y de aplicación no incluyen credenciales ni cuerpos financieros.

## Despliegue con GitHub Actions y PM2

Archivos: `.github/workflows/deploy.yml`, `deploy/ecosystem.config.cjs` y
`deploy/activate.sh`. El workflow se lanza manualmente. Compila en Ubuntu x64
con Node 22 y transfiere el standalone por SSH; el VPS no instala dependencias
ni compila. Requiere Linux x86_64 con glibc, Node 22, PM2, bash, tar y curl.
Para ARM o Alpine debe adaptarse el entorno de compilación antes de desplegar.

### Preparación única del servidor

Usar el mismo usuario de SSH y PM2 en todos los pasos. Debe poder escribir en
`/var/www/budget.jonmb.com/app`. Node 22 y PM2 deben estar disponibles también
en sesiones SSH no interactivas. El script carga `$HOME/.nvm/nvm.sh` si existe
y selecciona Node 22 sin cambiar el alias predeterminado. Para preparar nvm,
ejecutar una vez como el usuario de despliegue:

```bash
nvm install 22
nvm use 22
npm install -g pm2
```

PM2 se instala por versión de Node. No es necesario quitar Node 24 ni cambiar
los procesos de otras aplicaciones. La configuración fija el intérprete de
budget-app a la versión de Node que ejecuta el comando de despliegue.

```bash
mkdir -p /var/www/budget.jonmb.com/app/releases
mkdir -p /var/www/budget.jonmb.com/app/shared/sessions
chmod 700 /var/www/budget.jonmb.com/app/shared
nano /var/www/budget.jonmb.com/app/shared/.env
```

Contenido del archivo; sustituir la clave y verificar la URL local de la API:

```dotenv
BUDGET_APP_API_URL=http://127.0.0.1:3000/api
BUDGET_APP_API_KEY=REEMPLAZAR_CON_LA_CLAVE_REAL
BUDGET_APP_ORIGIN=https://budget.jonmb.com
BUDGET_APP_ALLOW_REGISTRATION=false
```

```bash
chmod 600 /var/www/budget.jonmb.com/app/shared/.env
```

La configuración de PM2 fija el puerto 3003, host 127.0.0.1 y las sesiones en
`shared/sessions`. Mantener libre el puerto 3003 antes del primer despliegue.
No sustituye archivos existentes en la raíz ni modifica la API o Caddy.

### Acceso desde GitHub

Crear una clave SSH dedicada sin contraseña. Autorizar su clave pública en
`~/.ssh/authorized_keys` del usuario de despliegue. En GitHub, crear el entorno
`production` y configurar estos secretos (Settings → Environments → production):

- `SSH_HOST`: IP o dominio del servidor, sin protocolo.
- `SSH_USER`: usuario propietario del proceso PM2 y directorio de despliegue.
- `SSH_PRIVATE_KEY`: clave privada completa del acceso dedicado.
- `SSH_KNOWN_HOSTS`: entrada del servidor en known_hosts, verificada por un canal
  confiable. Para puerto distinto de 22, usar el formato `[host]:puerto`.

La variable `SSH_PORT` es opcional y vale 22 por defecto. Las credenciales de
la API permanecen en el VPS; no hacen falta para compilar en GitHub.

### Publicación y primer arranque

Subir estos archivos a GitHub e integrar el workflow en la rama predeterminada.
Abrir Actions → Deploy budget-app → Run workflow y seleccionar la versión.
El workflow valida, compila, copia y ejecuta `pm2 startOrRestart`: crea
`budget-app` la primera vez y lo reinicia en siguientes publicaciones.
El reinicio en modo fork puede causar una interrupción breve.

Cada paquete se extrae en `releases/<commit>-<run>-<attempt>`, `current` apunta a
la versión activa. La comprobación local de `/app/health` verifica el arranque
HTTP, no la conexión con la API ni los flujos autenticados. Si falla, se restaura
la versión anterior; en el primer despliegue se detiene el proceso fallido.
Después de publicar, comprobar login y consultas reales de la aplicación.
Las versiones antiguas se conservan; revisar periódicamente su espacio en disco.

En el VPS, después del primer despliegue exitoso:

```bash
pm2 status budget-app
pm2 logs budget-app --lines 50
pm2 startup
# Ejecutar la instrucción que PM2 imprima para habilitar el arranque del sistema.
pm2 save
```

Caddy debe enviar `/app` y `/app/*` a `127.0.0.1:3003` conservando el prefijo,
como en el ejemplo anterior. El workflow no modifica el proxy.

Referencias: [PM2 ecosystem](https://pm2.keymetrics.io/docs/usage/application-declaration/),
[PM2 startup](https://pm2.keymetrics.io/docs/usage/startup/) y
[GitHub secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

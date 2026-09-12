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

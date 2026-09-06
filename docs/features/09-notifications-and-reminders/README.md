# Feature 09: PWA y recordatorios

## Objetivo

Instalar la app en dispositivos Apple y habilitar avisos de pago.

Estado: planeada. Los checklists describen trabajo futuro; no certifican implementación.

Referencia API: [feature equivalente](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/features/09-notifications-and-reminders).

## Integración

GET /api/notifications/web-push/public-key; POST /web-push/subscribe; DELETE /web-push/unsubscribe; POST /test y /trigger-reminders.

Aplican [contratos](../../integration.md), [decisiones](../../decisions.md) y [criterios globales de calidad](../../quality.md). Las dependencias GAP remiten al [registro de diferencias](../../api-gaps.md).

## Historias de usuario

### HU-FE-09.1: Instalación PWA

> Como usuario de Budget-APP, quiero instalar la web en iPhone, iPad y Mac, para abrirla como una app.

Criterios de aceptación:

- [ ] Manifest con id/start_url/scope bajo /app/, nombre, iconos y display standalone; service worker bajo /app/.
- [ ] Guía según capacidades para Añadir a inicio/Dock; sin prometer aviso automático de instalación en todos los navegadores.
- [ ] Al abrir instalada sin sesión se muestra login; enlaces internos permanecen dentro del scope.

### HU-FE-09.2: Sin conexión y actualización de app

> Como usuario de Budget-APP, quiero entender cuándo no hay conexión y actualizar sin perder trabajo, para evitar creer que guardé algo que no se envió.

Criterios de aceptación:

- [ ] Offline muestra shell público y aviso; operaciones financieras requieren conexión y no se encolan silenciosamente.
- [ ] No cachear /api, /app/bff, páginas financieras ni respuestas RSC privadas; limpiar cachés antiguas.
- [ ] Nueva versión avisa y espera confirmación si hay formulario con cambios; recuperada conexión reconsulta datos.

### HU-FE-09.3: Activar y desactivar push

> Como usuario de Budget-APP, quiero autorizar avisos en cada dispositivo, para recibir recordatorios cuando no tengo abierta la app.

Criterios de aceptación:

- [ ] Pedir permiso desde acción explícita; detectar soporte, permiso denegado y requisito de instalación cuando corresponda.
- [ ] Obtener publicKey y registrar endpoint/keys; registrar múltiples dispositivos y desuscribir el actual.
- [ ] Click abre ruta interna validada dentro /app; datos requieren sesión y aviso en bloqueo minimiza detalle sensible.

### HU-FE-09.4: Correo y prueba de avisos

> Como usuario de Budget-APP, quiero comprobar que mis recordatorios funcionan, para tener respaldo por correo.

Criterios de aceptación:

- [ ] Ajustes explican canales configurados por servidor y muestran resultados de prueba; success=true externo no garantiza entrega de cada canal.
- [ ] Prueba solo por acción explícita al propio email; UI no expone targetEmail arbitrario.
- [ ] No presentar preferencias personales, horario configurable ni bandeja persistente si la API no los ofrece.

### HU-FE-09.5: Recordatorios de vencimiento confiables

> Como usuario de Budget-APP, quiero recibir alertas de tarjetas, servicios y cobros, para recordar mis compromisos a tiempo.

Criterios de aceptación:

- [ ] Mostrar agenda basada en fechas; programación real actual del servidor: 08:00 y ventana 0–3 días, no preferencia individual.
- [ ] Alertas no afirman saldo de tarjeta cuando backend envía amount=0 como desconocido.
- [ ] Servicios, deudas y fechas fin de mes requieren prueba integrada de tipos de fecha; créditos con intereses quedan como ampliación explícita.

## Tickets técnicos

### TICKET-FE-09.1: Instalación PWA

Historia: HU-FE-09.1 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-01.3, FE-02.1. Dependencias de API: —.

Implementación:

- [ ] Crear manifest, iconos incluidos Apple y registro del service worker; detectar standalone.
- [ ] Preparar guía y revisión real en Safari/iOS/iPadOS/macOS compatibles; versiones verificadas al implementar.
- [ ] Verificar: Instalar desde HTTPS en cada dispositivo objetivo; iconos y rutas profundas correctos al cerrar y abrir.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-09.2: Sin conexión y actualización de app

Historia: HU-FE-09.2 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-09.1. Dependencias de API: —.

Implementación:

- [ ] Implementar estrategia de caché solo para recursos públicos versionados y pantalla offline.
- [ ] Diseñar borradores en memoria durante fallos, sin persistencia financiera local por defecto.
- [ ] Verificar: Modo avión en mitad de alta no crea éxito falso; actualizar service worker no descarta formulario sin aviso.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-09.3: Activar y desactivar push

Historia: HU-FE-09.3 · Prioridad: P1 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-09.1, FE-02.2. Dependencias de API: GAP-12.

Implementación:

- [ ] Integrar PushManager y eventos push/notificationclick; adaptar payload real y fallback a inicio.
- [ ] DELETE unsubscribe lleva body endpoint; revisar asociación a usuario y limpieza al salir.
- [ ] Verificar: Permitir, denegar, reactivar desde ajustes del sistema; probar en dispositivo real y cambio de usuario.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-09.4: Correo y prueba de avisos

Historia: HU-FE-09.4 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-09.3. Dependencias de API: GAP-12.

Implementación:

- [ ] Integrar POST test con channel del enum real y mostrar pushResult/emailResult; no probar enviando durante montaje.
- [ ] Diseñar preferencias como ampliación GAP-12, sin controles que aparenten persistir.
- [ ] Verificar: SMTP no configurado informa fallo de canal; push no admitido mantiene alternativa de correo disponible si configurada.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-09.5: Recordatorios de vencimiento confiables

Historia: HU-FE-09.5 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-09.4, FE-08.3. Dependencias de API: GAP-14.

Implementación:

- [ ] Preparar QA con reloj controlado y notificaciones de prueba; trigger-reminders solo herramienta explícita de diagnóstico, nunca al renderizar.
- [ ] Resolver GAP-14; incluir enlaces seguros a agenda y documentación de zona horaria del VPS.
- [ ] Verificar: Vencimiento hoy/en 3 días/fuera de ventana, febrero con día 31, pago ya realizado y prevención de duplicados.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

## Verificación de la feature

Ejecutar los escenarios de cada ticket con fixtures sintéticos, casos de error y dispositivos de la matriz de calidad. Un ticket con GAP puede avanzar en diseño y pruebas con fixtures, pero no se considera integrado hasta cerrar su dependencia y ejecutar el contrato contra staging.

[Volver al índice](../../README.md)

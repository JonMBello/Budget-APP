# Feature 01: Arquitectura, diseño adaptable e infraestructura

## Objetivo

Establecer React y Next.js, integración segura con NestJS y una experiencia móvil sin tablas tipo spreadsheet.

Estado: planeada. Los checklists describen trabajo futuro; no certifican implementación.

Referencia API: [feature equivalente](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/features/01-setup-and-infrastructure).

## Integración

Sin cambio de NestJS/MongoDB; GET /api/health para diagnóstico del servidor.

Aplican [contratos](../../integration.md), [decisiones](../../decisions.md) y [criterios globales de calidad](../../quality.md). Las dependencias GAP remiten al [registro de diferencias](../../api-gaps.md).

## Historias de usuario

### HU-FE-01.1: Base Next.js y calidad

> Como usuario de Budget-APP, quiero contar con una aplicación web mantenible, para desarrollar las funciones de forma incremental.

Criterios de aceptación:

- [ ] Proyecto React/Next.js con App Router, TypeScript estricto, lockfile y scripts de desarrollo, build, lint, tipos y pruebas.
- [ ] Configurar basePath /app; rutas y recursos funcionan al abrir una URL profunda directamente.
- [ ] Validar variables de servidor y separar configuración pública; documentar arranque local y entorno de integración.

### HU-FE-01.2: Cliente API y capa de servidor

> Como usuario de Budget-APP, quiero guardar y consultar mis datos sin exponer credenciales, para usar mi presupuesto de forma segura.

Criterios de aceptación:

- [ ] El navegador llama a /app/bff; Next.js añade x-api-key a todas las llamadas upstream y Bearer en las protegidas.
- [ ] La clave y los tokens no aparecen en JavaScript, localStorage, respuestas públicas o logs.
- [ ] Validación de rutas/métodos permitidos, cuerpos y origen; errores en español sin filtrar secretos.
- [ ] Consultas aisladas por sesión y periodo; datos privados no se cachean en servidor compartido ni service worker.

### HU-FE-01.3: Navegación iPhone, iPad y Mac

> Como usuario de Budget-APP, quiero navegar con controles cómodos para cada pantalla, para registrar movimientos desde cualquier dispositivo.

Criterios de aceptación:

- [ ] iPhone: barra inferior Inicio, Ingresos, Gastos, Más; safe areas y teclado no tapan acciones.
- [ ] iPad: barra superior con secciones y acceso a Más; Mac: navegación superior y contenido en columnas.
- [ ] En ventanas estrechas de iPad se adapta a ancho disponible; no depende únicamente del user-agent.
- [ ] Cambiar de sección conserva el periodo elegido y permite volver desde el detalle.

### HU-FE-01.4: Sistema visual oscuro y estados comunes

> Como usuario de Budget-APP, quiero ver importes y acciones con claridad, para entender mis finanzas sin una cuadrícula.

Criterios de aceptación:

- [ ] Paleta oscura con verde para ingresos/positivo, azul para información y rojo para gasto/alerta; texto e iconos complementan el color.
- [ ] Tarjetas, listas por fecha, barras y paneles de detalle; formularios en hoja o diálogo según espacio.
- [ ] Todas las vistas tienen carga, vacío con siguiente acción, error con reintento y estado sin conexión.
- [ ] Contraste objetivo 4.5:1 en texto normal; importes negativos visibles, movimiento reducido y anuncios accesibles al guardar.

### HU-FE-01.5: Despliegue en el VPS

> Como usuario de Budget-APP, quiero abrir budget.jonmb.com/app y conservar /api, para usar una única dirección segura.

Criterios de aceptación:

- [ ] Caddy envía /api y /api/* a NestJS, /app y /app/* a Next.js conservando prefijos; / redirige a /app.
- [ ] Next.js corre como servicio Node con reinicio, TLS en Caddy y secretos exclusivamente del servidor.
- [ ] Swagger /api/docs continúa accesible; instalación PWA y rutas profundas sobreviven al reinicio.

## Tickets técnicos

### TICKET-FE-01.1: Base Next.js y calidad

Historia: HU-FE-01.1 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: —. Dependencias de API: —.

Implementación:

- [ ] Inicializar src/app, src/features, src/components y src/lib; fijar versiones estables compatibles al implementar.
- [ ] Preparar pruebas de componentes y E2E; fixtures sintéticos por usuario y periodo; CI con build, tipos y lint.
- [ ] Verificar: Build de producción y navegación directa a /app/login sin errores de recursos.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-01.2: Cliente API y capa de servidor

Historia: HU-FE-01.2 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-01.1. Dependencias de API: —.

Implementación:

- [ ] Implementar adaptadores tipados con contratos de integration.md; allowlist de upstream fijo, límites de cuerpo y timeout.
- [ ] Integrar sesiones de FE-02.1; protección CSRF en mutaciones; propagar errores 400/401/403/404/409/429/5xx.
- [ ] Reintentar consultas de forma acotada; mutaciones sin reintento ciego tras timeout.
- [ ] Verificar: Comprobar ausencia de secretos en bundle y trazas; rechazar origen extraño, ruta arbitraria y usuario sin sesión.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-01.3: Navegación iPhone, iPad y Mac

Historia: HU-FE-01.3 · Prioridad: P1 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-01.1. Dependencias de API: —.

Implementación:

- [ ] Crear shell, selector de mes, enlaces activos y menú Más para tarjetas, personas, recurrentes, historial y ajustes.
- [ ] Usar anchos de contenido, foco visible, etiquetas accesibles, navegación con teclado y objetivos táctiles de 44 px como objetivo de diseño.
- [ ] Verificar: Revisar a 375, 390, 768, 1024 y 1440 px, iPad Split View, vertical/horizontal y zoom 200%.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-01.4: Sistema visual oscuro y estados comunes

Historia: HU-FE-01.4 · Prioridad: P1 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-01.1. Dependencias de API: —.

Implementación:

- [ ] Definir tokens propuestos fondo #0B1220, superficie #142235, texto #F1F5F9, verde #34D399, azul #60A5FA y rojo #F87171; validar combinaciones reales.
- [ ] Crear Money, DateField, AmountInput, EmptyState, ErrorState, ConfirmDialog y tarjetas; evitar tablas como interfaz financiera.
- [ ] Verificar: Validar teclado, VoiceOver, contraste de pares usados, importes largos y foco devuelto tras cerrar modal.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-01.5: Despliegue en el VPS

Historia: HU-FE-01.5 · Prioridad: P0 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-01.2, FE-02.1, FE-09.1. Dependencias de API: —.

Implementación:

- [ ] Implementar guía y configuración basada en deployment.md con puertos reales del VPS, servicio y rollback.
- [ ] Agregar healthcheck del frontend, logs sin datos financieros y despliegue reproducible; probar primero en staging.
- [ ] Verificar: Smoke de login, /app/_next, /app/bff, manifest, service worker y /api/docs; rollback a artefacto anterior.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

## Verificación de la feature

Ejecutar los escenarios de cada ticket con fixtures sintéticos, casos de error y dispositivos de la matriz de calidad. Un ticket con GAP puede avanzar en diseño y pruebas con fixtures, pero no se considera integrado hasta cerrar su dependencia y ejecutar el contrato contra staging.

[Volver al índice](../../README.md)

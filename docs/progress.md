# Avance de implementación

El objetivo es implementar las nueve features, agregando tests y ejecutando todos los anteriores antes de cada commit. La planeación sigue siendo el alcance completo; este registro distingue código entregado de integración externa pendiente.

## 01 · Setup e infraestructura — base verificada

Implementado: Next.js/React con TypeScript, basePath /app, tema oscuro y componentes accesibles reutilizables, navegación adaptable con periodo en enlaces, utilidades de importes/fechas, cliente API exclusivo del servidor sin caché ni reintentos automáticos de mutaciones, validación de entorno, healthcheck, configuración de CI y ejemplos de operación en VPS.

Pruebas: contratos del cliente API con transporte simulado, ausencia de solicitudes sin token, protección de rutas upstream, dinero/fechas reales, errores accesibles, navegación por periodo y smoke HTTP contra build de producción.

Pendiente dentro de la feature planificada: BFF autenticado se integra junto a feature 02; menú/selector funcional se conecta al implementar periodos y páginas; despliegue en VPS y validación en dispositivos Apple requieren entorno y pruebas al final. No se marca toda la feature 01 como completada por entregar su base.

Resultado de verificación: `npm run verify` pasó con 29 pruebas de unidades/componentes y 2 pruebas HTTP contra el paquete standalone de producción. Lint, tipos y build correctos.

## 02 · Autenticación y perfil — base verificada

Implementado: Almacén de sesiones seguras en servidor (cookie HttpOnly/SameSite=lax/Path=/app con ID opaco sha256 y TTL de 7 días), proxy de Next.js para protección estricta de rutas privadas y redirección con returnTo seguro, endpoints BFF en servidor (/app/bff/auth/[action] y /app/bff/profile), coordinador de renovación concurrente de tokens (refresh lockeado por sesión), rate limit de intentos de autenticación, pantalla de inicio de sesión (/app/login), pantalla de registro bajo flag con validación de inviteCode (/app/register), vista de Más (/app/more) y vista de perfil (/app/settings/profile) con edición de nombre y cambio de moneda bloqueado si existen movimientos o presupuestos previos.

Pruebas: Contratos Zod de formularios y DTOs, rate limit por IP/identidad, almacenamiento durable de sesiones con permisos privados 0600 y descarte de traversal, renovación concurrente única de tokens upstream, descarte de sesión ante refresh revocado o identidad cambiada, validaciones de formularios en componentes React (AuthForm, ProfileForm, LogoutButton) y suite E2E de Playwright (login opaco HttpOnly, rutas privadas cerradas, rechazo de origen cruzado, registro invitado y restricciones de moneda).

Resultado de verificación: `npm test` pasó con 59 pruebas unitarias y de componentes. `npm run test:e2e` pasó con 8 pruebas E2E contra el build de producción y servidor sintético de integración. Lint, tipos y build standalone correctos.

## 03–09 · Pendientes

Se implementarán incrementalmente según docs/roadmap.md. Los GAP de API deben revalidarse antes de integrar el flujo afectado. No se sustituyen automatismos financieros faltantes por éxito simulado.

# Avance de implementación

El objetivo es implementar las nueve features, agregando tests y ejecutando todos los anteriores antes de cada commit. La planeación sigue siendo el alcance completo; este registro distingue código entregado de integración externa pendiente.

## 01 · Setup e infraestructura — base verificada

Implementado: Next.js/React con TypeScript, basePath /app, tema oscuro y componentes accesibles reutilizables, navegación adaptable con periodo en enlaces, utilidades de importes/fechas, cliente API exclusivo del servidor sin caché ni reintentos automáticos de mutaciones, validación de entorno, healthcheck, configuración de CI y ejemplos de operación en VPS.

Pruebas: contratos del cliente API con transporte simulado, ausencia de solicitudes sin token, protección de rutas upstream, dinero/fechas reales, errores accesibles, navegación por periodo y smoke HTTP contra build de producción.

Pendiente dentro de la feature planificada: BFF autenticado se integra junto a feature 02; menú/selector funcional se conecta al implementar periodos y páginas; despliegue en VPS y validación en dispositivos Apple requieren entorno y pruebas al final. No se marca toda la feature 01 como completada por entregar su base.

Resultado de verificación: `npm run verify` pasó con 29 pruebas de unidades/componentes y 2 pruebas HTTP contra el paquete standalone de producción. Lint, tipos y build correctos.

## 02–09 · Pendientes

Se implementarán incrementalmente según docs/roadmap.md. Los GAP de API deben revalidarse antes de integrar el flujo afectado. No se sustituyen automatismos financieros faltantes por éxito simulado.

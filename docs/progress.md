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

## 03 · Cuentas, tarjetas y fechas de pago — base verificada

Implementado: Catálogo integral de métodos de pago (tarjetas de crédito, cuentas de débito y efectivo), contratos Zod para alta y actualización (`createCardSchema`, `updateCardSchema`, `cardSchema`), validación obligatoria de día de corte y día límite de pago (1-31) exclusivamente para `CREDIT`, exclusión de datos bancarios sensibles (nunca CVV ni 16 dígitos, solo últimos 4 opcionales), endpoints BFF en `/app/bff/cards`, `/app/bff/cards/[id]` y `/app/bff/cards/[id]/preview`, vista de listado `/app/cards` con filtrado de activas/archivadas, vista de detalle `/app/cards/[id]`, modal y acción de archivo lógico (`DELETE`), y simulador interactivo de ciclos bancarios (`PurchaseSimulator`) que proyecta fecha de corte, fecha límite de pago, mes presupuestario impactado y cuenta regresiva de días.

Pruebas: Contratos de validación de tarjetas y previsualización de estados de cuenta, pruebas de componentes React (`CardForm`, `PurchaseSimulator`, `CardVisual`, `CardDetail`, `CardList`), fixture sintético de ciclos bancarios en `tests/fixtures/api-server.mjs` y 4 nuevas pruebas E2E en Playwright cubriendo validación de días de ciclo en crédito, creación sin ciclos en débito/efectivo, simulación de ciclos antes/después del corte y archivo lógico sin eliminación física.

Resultado de verificación: `npm test` pasó con 81 pruebas unitarias y de componentes. `npm run test:e2e` pasó con 12 pruebas E2E contra el build de producción standalone. Lint, tipos y build standalone correctos.

## 04 · Personas y cuentas por cobrar — base verificada

Implementado: Directorio de personas de confianza para préstamos y gastos compartidos (`/app/people`), contratos Zod para alta y actualización (`createPersonSchema`, `updatePersonSchema`, `personSchema`, `debtSummarySchema`, `settleDebtSchema`), endpoints BFF en `/app/bff/people`, `/app/bff/people/[id]`, `/app/bff/people/[id]/debts` y `/app/bff/people/[id]/settle`, vista de listado accesible con búsqueda en tiempo real por nombre/contacto, tabs de filtro activas/todas, modal y formulario de alta/edición, vista de detalle `/app/people/[id]` con resumen interactivo de deudas desglosado por MSI (con tarjeta y cuota), servicios recurrentes compartidos y gastos puntuales, acción de marcado y cobro de deudas puntuales (`settle`), y archivo lógico seguro (`DELETE`).

Pruebas: Contratos de validación de personas y desglose de deudas, pruebas de componentes React (`PersonForm`, `PersonList`, `PersonDetail`, `DebtSummaryView`), soporte sintético para personas y deudas en `tests/fixtures/api-server.mjs`, y 4 nuevas pruebas E2E en Playwright cubriendo validación de longitud mínima de nombre (2 caracteres), alta con contacto y notas, consulta y cobro de compromisos pendientes, y archivo lógico verificado en listados activos e inactivos.

Resultado de verificación: `npm test` pasó con 99 pruebas unitarias y de componentes. `npm run test:coverage` pasó con 90% de cobertura en líneas. `npm run test:e2e` pasó con 16 pruebas E2E contra el build de producción standalone. Lint, tipos y build standalone correctos.

## 05 · Periodos mensuales, historial y ahorro — base verificada

Implementado: Gestión integral de periodos presupuestarios en URL (`?period=YYYY-MM`), contratos Zod (`budgetPeriodSchema`, `initializeBudgetSchema`, `updateSavingsSchema`, `updateStatusSchema`, `budgetSummarySchema`), endpoints BFF en `/app/bff/budgets`, `/app/bff/budgets/current`, `/app/bff/budgets/initialize`, `/app/bff/budgets/[year]/[month]`, `/app/bff/budgets/[year]/[month]/savings`, `/app/bff/budgets/[year]/[month]/status` y `/app/bff/budgets/[year]/[month]/summary`, asistente de inicialización (`InitializeMonthWizard`) con cálculo previo de remanente/déficit y absorción transparente de conflictos 409 para reutilizar periodos existentes, selector accesible de meses (`PeriodSelector`), control de cierre y reapertura con confirmación modal (`PeriodStatusControl`), banner de modo solo lectura para periodos cerrados (`PeriodClosedBanner`), editor de ahorro acarreado con notas (`CarriedSavingsEditor`), dashboard principal conectado (`BudgetDashboard` en `/app`), vista de historial y comparador analítico de meses con barras relativas (`/app/budgets`), y acceso directo en `/app/more`.

Pruebas: Contratos de validación de periodos y transiciones de fin de año, pruebas de componentes React (`PeriodSelector`, `InitializeMonthWizard`, `PeriodStatusControl`, `CarriedSavingsEditor`, `BudgetHistoryView`, `BudgetDashboard`), endpoints sintéticos de presupuestos en `tests/fixtures/api-server.mjs`, y 6 nuevas pruebas E2E en Playwright cubriendo rechazo de meses inválidos y creación válida, recuperación transparente ante 409, ajuste de ahorro con déficit negativo y notas, transición de año (2026-12 a 2027-01), cierre/reapertura con bloqueo de mutaciones en modo cerrado, y consulta de historial cronológico inverso y resúmenes calculados.

Resultado de verificación: `npm test` pasó con 121 pruebas unitarias y de componentes. `npm run test:coverage` pasó con 87.25% de cobertura en líneas. `npm run test:e2e` pasó con 22 pruebas E2E contra el build de producción standalone. Lint, tipos y build standalone correctos.

## 06 · Servicios, suscripciones y MSI — base verificada

Implementado: Catálogo y seguimiento de compromisos recurrentes mensuales y compras a plazos (`/app/recurring`), contratos Zod (`recurringCategorySchema`, `recurringSplitSchema`, `recurringTemplateSchema`, `createRecurringSchema`, `updateRecurringSchema`, `advanceMsiSchema`, `instantiateRecurringSchema`, y función `calculateMsiInstallments` con ajuste de centavos en la cuota final), endpoints BFF en `/app/bff/recurring`, `/app/bff/recurring/[id]`, `/app/bff/recurring/[id]/advance`, `/app/bff/recurring/[id]/cancel` y `/app/bff/recurring/instantiate`, vista de listado accesible con pestañas de filtro (Todas, Servicios, Suscripciones, MSI, Inactivas), generación mensual (`instantiate`) idempotente con diálogo de confirmación y resumen de conteo, vista de detalle `/app/recurring/[id]` con pausar/reanudar, cancelación definitiva con advertencia de retención de historial, modal para adelantar cuotas específicas o liquidar el saldo total de planes MSI (`MsiAdvanceModal`) con advertencia en planes compartidos con terceros, tarjeta visual (`RecurringCard`) con barra de progreso de cuotas y montos, y acceso directo desde el menú Más (`/app/more`).

Pruebas: Contratos de validación para compromisos fijos y planes MSI con redondeo exacto de centavos, pruebas de componentes React (`RecurringCard`, `RecurringForm`, `MsiAdvanceModal`, `RecurringList`, `RecurringDetail`), endpoints sintéticos en `tests/fixtures/api-server.mjs`, y 6 nuevas pruebas E2E en Playwright cubriendo alta de servicios y suscripciones con validación de campos obligatorios, registro de MSI con redondeo de centavos y rechazo de cuota inicial mayor al plazo, pausado, reapertura y cancelación definitiva de compromisos, adelanto de cuotas y liquidación de saldo total de MSI, instanciación mensual idempotente, y renderizado de la página con filtrado por categoría.

Resultado de verificación: `npm test` pasó con 143 pruebas unitarias y de componentes. `npm run test:coverage` pasó con 83.52% de cobertura en líneas. `npm run test:e2e` pasó con 28 pruebas E2E contra el build de producción standalone. Lint, tipos y build standalone correctos.

## 07–09 · Pendientes

Se implementarán incrementalmente según docs/roadmap.md. Los GAP de API deben revalidarse antes de integrar el flujo afectado. No se sustituyen automatismos financieros faltantes por éxito simulado.

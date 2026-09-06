# Contratos de integración

Referencia estática: Budget-API `bebfc5e5694d717d65fc34c69efd5d4b035a1ab5`. Ver [fuentes](sources.md). Los métodos se verificaron en controladores; las garantías se contrastaron con servicios y DTOs. No se ejecutaron operaciones autenticadas contra producción.

## Transporte y sesión

Navegador → `/app/bff/...` de Next.js → `/api/...` de NestJS. Todas las llamadas upstream llevan `x-api-key`; todas salvo auth/register, auth/login, auth/refresh y health llevan además Bearer. VAPID public-key también requiere autenticación.

BFF tiene origen upstream fijo y allowlist de método/ruta, no un proxy arbitrario. Cada handler verifica sesión, acepta únicamente campos del DTO y valida el origen/CSRF en mutaciones. Sesión opaca en cookie HttpOnly, Secure, SameSite=Lax y Path=/app; JWT y refresh en almacén del servidor con TTL. Bloqueo de renovación por sesión entre solicitudes concurrentes, persistente/compartido si hay varios procesos. Expiración elimina estado privado. HTTPS obligatorio fuera de desarrollo.

Variables propuestas del servidor: `BUDGET_APP_API_URL` (URL interna con /api), `BUDGET_APP_API_KEY`, `BUDGET_APP_ORIGIN`, `BUDGET_APP_SESSION_STORE_URL`, `BUDGET_APP_PORT`. No tienen prefijo NEXT_PUBLIC. Configuración pública permitida: nombre de app, flag visual de registro y basePath fijo de build. No loggear cuerpos, cookies, tokens, nombres de deudores ni importes.

## Mapa de endpoints existentes

En la tabla las rutas parten de `/api`. CRUD significa POST/GET de colección y GET/PATCH/DELETE por id, salvo donde se indica explícitamente.

| Módulo | Método y ruta | Entrada/consulta | Consumo web |
|---|---|---|---|
| Salud | GET /health | Sin JWT; sí API key | Diagnóstico servidor |
| Auth | POST /auth/login | email, password | Retorna accessToken, refreshToken, user |
| Auth | POST /auth/register | email, password, name, inviteCode, currency opcional | 403 registro cerrado/invitación; 409 duplicado |
| Auth | POST /auth/refresh | refreshToken | Nuevo par; rotación con hash único por usuario |
| Perfil | GET/PATCH /users/me | PATCH name/currency | email de solo lectura |
| Tarjetas | CRUD /cards | includeInactive en GET; campos de CreateCardDto | DELETE desactiva |
| Tarjetas | GET /cards/:id/preview-statement | date=YYYY-MM-DD | corte, vencimiento, mes impactado, daysUntilDue |
| Personas | CRUD /people | includeInactive; nombre/contacto/notas | DELETE desactiva |
| Personas | GET /people/:id/debts | id | totalDebt, immediateDueAmount, nextPaymentDueDate, msiInstallments, recurringServices, singleExpenses |
| Personas | POST /people/:id/settle | expenseId, amount, recurringTemplateId, notes opcionales en DTO | Solo expenseId tiene actualización persistente observada; GAP-04 |
| Periodos | GET /budgets | Sin filtros de paginación verificados | Orden inverso; totales persistidos pueden estar desactualizados |
| Periodos | GET /budgets/current; GET /budgets/:year/:month | Año/mes en ruta | current puede devolver último periodo incluso cerrado |
| Periodos | POST /budgets/initialize | year, month, carriedSavings, totalIncome, totalExpenses, notes opcionales | UI envía siempre año/mes; 409 si existe |
| Periodos | PATCH /budgets/:year/:month/savings | carriedSavings | Ahorro editable |
| Periodos | PATCH /budgets/:year/:month/status | status OPEN/CLOSED | Cierre/reapertura |
| Periodos | PATCH /budgets/:year/:month/income | totalIncome | Disponible, no expuesto como sustituto del CRUD |
| Periodos | PATCH /budgets/:year/:month | carriedSavings, totalIncome, totalExpenses, notes | UI limita a ajustes coherentes; GAP-03 |
| Resumen | GET /budgets/current/summary; GET /budgets/:year/:month/summary | Año/mes | Totales calculados desde movimientos |
| Recurrentes | CRUD /recurring | includeInactive y category en GET | category, no type |
| Recurrentes | POST /recurring/instantiate | year, month | items devueltos, no Expense persistido observado; GAP-01 |
| Recurrentes | POST /recurring/:id/advance | installmentsCount o payAll, notes | Modifica contador/estado; GAP-06 |
| Recurrentes | PATCH /recurring/:id/cancel | Sin body requerido | Desactiva plantilla |
| Gastos | CRUD /expenses | GET periodId y category | DELETE borra gasto; conserva ingreso recibido en remove |
| Ingresos | CRUD /incomes | GET periodId | Sin filtros de source ni paginación verificados |
| Ingresos | POST /incomes/copy-from-previous-month | fromPeriodId, toPeriodId | Copia todos excepto DEBT_COLLECTION; GAP-02 |
| Push | GET /notifications/web-push/public-key | Sesión requerida | publicKey |
| Push | POST /notifications/web-push/subscribe | endpoint, keys {p256dh, auth}, campos opcionales según DTO | Registro por dispositivo |
| Push | DELETE /notifications/web-push/unsubscribe | Body {endpoint} | Baja del dispositivo |
| Avisos | POST /notifications/test | channel WEB_PUSH/EMAIL/ALL, title/message opcionales | Inspeccionar pushResult y emailResult, no solo success |
| Avisos | POST /notifications/trigger-reminders | Sin body | Diagnóstico manual con efectos de envío; no ejecutar automáticamente |

No existe `/auth/logout`, recuperación de contraseña, preferencias de notificación ni endpoint de créditos en controladores revisados. Logout de primera versión es de la sesión BFF. Los códigos declarados por Swagger pueden diferir del HTTP efectivo de POST sin HttpCode: tolerar el 2xx correcto del contrato y validar contra staging; no considerar un body success prueba de consistencia financiera.

## Campos y reglas de adaptación

- Gastos: `periodId`, `title`, `amount`, `category`, `date`; opcionales `cardId`, `templateId`, `paymentDueDate`, `isPaid`, `split`, `notes`. Ingresos: `periodId`, `title`, `amount`, `date`, `source`; opcionales `isReceived`, `dueDate`, `debtorPersonId`, `notes`.
- Fuentes: PAYROLL, DEBT_COLLECTION, DEPOSIT, INVESTMENT, OTHER.
- Categorías de gasto: SERVICE, SUBSCRIPTION, MSI, REGULAR_EXPENSE, FOOD, TRANSPORT, HOUSING, HEALTH, ENTERTAINMENT, SHOPPING, OTHER. Recurrentes: SERVICE, SUBSCRIPTION, MSI, OTHER_RECURRING; este último no está en ExpenseCategory.
- Ambos tipos de split usan `{personId, splitType: 'PERCENTAGE'|'FIXED', splitValue}`. Gasto acepta también `isDebtActive`. No usar `{type,value}` del ejemplo narrativo de API.
- Recurrentes usan `category`, `amount`, `currency`, `exchangeRate`, `totalAmount`, `totalInstallments`, `currentInstallment`, `startDate`, `split`; no `type` ni `monthlyAmount`. Ediciones no necesariamente aplican todos los campos heredados por DTO: por ejemplo startDate no se asigna en update observado.
- IDs de respuesta se normalizan como `id`; no depender de `_id` en componentes. Nulos de fecha/tarjeta no se convierten a datos inventados.
- Importes de preview se calculan con precisión decimal/centavos para UI; API sigue siendo fuente final. Validar montos positivos, límites de split, cuotas enteras y fechas de calendario además de formato. No enviar campos extra: API usa forbidNonWhitelisted.
- Fechas civiles no deben renderizarse como día anterior al convertir UTC a México. Conservar YYYY-MM-DD y distinguir de timestamps createdAt. Revisar `startDate`, fecha de cargo, corte y pago de forma separada.
- Los movimientos no tienen currency/exchangeRate; las plantillas sí. No convertir ni mezclar divisas en totales hasta GAP-10.

## Métricas reales

`totalExpenses` y `totalPaidExpenses` son plurales. `payrollSurplus` contiene `totalPayrollIncome`, `fixedCommitments`, `services`, `subscriptions`, `msi`, `initialDiscretionaryPayrollSurplus`, `regularExpenses`, `remainingDiscretionaryPayrollSurplus`. No existe el campo plano `discretionaryPayrollSurplus` descrito narrativamente en algunas HUs.

- netBalance = carriedSavings + totalIncome − totalExpenses (incluye proyecciones).
- cashInPocketBalance = carriedSavings + totalReceivedIncome − totalPaidExpenses (según registros; acarreo puede ser proyectado).
- fixedCommitments = SERVICE + SUBSCRIPTION + MSI.
- Remanente inicial = PAYROLL − fixedCommitments; restante = inicial − REGULAR_EXPENSE.
- receivables = pendingDebtCollections y debtors del periodo; cada deudor tiene personId, name, amount, earliestDueDate, pendingCount.

## Invalidaciones tras mutar

| Operación | Reconsultar |
|---|---|
| Ingreso | ingresos del periodo, summary, historial/periodo y proyección de ahorro |
| Gasto/split | gastos, ingresos, summary, periodo, persona/debts, agenda y resumen de tarjeta |
| Cobro | gasto, ingreso vinculado, persona/debts, summary y agenda |
| Plantilla/avance/cancelación | recurrentes, deudas, gastos/ingresos de periodos afectados, summary y agenda |
| Ahorro/estado | periodo, summary, historial, controles de edición |
| Apertura/copia/generación | periodos, movimientos destino, summary, recurrentes y deudas |
| Tarjeta/persona | catálogo, detalles, selectores y vistas dependientes; no mutar históricos solo por invalidar |

Claves de consulta incluyen identidad y periodId/año/mes. Cancelar consultas obsoletas al cambiar contexto; limpiar en logout. Tras timeout de escritura, avisar resultado desconocido y reconciliar consultando antes de permitir repetir. Deshabilitar botón no resuelve idempotencia entre dispositivos.

## Errores

API devuelve statusCode, error, message (string o arreglo), timestamp y path. Mapear validaciones conocidas a campos en español y fallback legible para desconocidas. 401 → renovación acotada o login; API key mal configurada → diagnóstico de servidor. 403 → permiso/registro cerrado; 404 → no encontrado, no cero; 409 → conflicto/mes existente; 429 → espera indicada; 5xx/red → conservar formulario y recuperación. No borrar formularios al primer error ni mostrar stack traces.

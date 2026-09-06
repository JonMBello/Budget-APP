# Diferencias entre planeación de API y código

Revisión estática de `bebfc5e5694d717d65fc34c69efd5d4b035a1ab5`; no pruebas contra datos reales. Los documentos de la API marcan módulos completos, pero las siguientes garantías no están respaldadas por el código leído. Cada GAP es un ticket de coordinación de backend pendiente, con aceptación de salida; no se modificó Budget-API. P0 bloquea liberar el flujo afectado, no el desarrollo independiente del frontend.

Las rutas de evidencia son relativas al [árbol revisado](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/src/modules).

## GAP-01 · P0 · Persistencia y atomicidad del motor mensual

**Evidencia:** recurring/recurring.service.ts, instantiateForMonth; budgets/budgets.service.ts, initializePeriod. Instanciar devuelve items y avanza currentInstallment sin crear Expense/Income, validar periodo ni deduplicar; initialize no llama al motor. startDate no filtra la instanciación.

**Trabajo API:** definir operación mensual persistente por usuario/periodo/plantilla, claves únicas, transacción o recuperación durable, política de fecha de cargo e impacto, arranque histórico y cuota final con redondeo. No hacer este motor con múltiples peticiones del navegador.

**Aceptación:** abrir mes guarda gastos/cobros y avanza una vez; dos solicitudes concurrentes y reintento tras fallo generan mismos IDs; no cuotas anteriores al inicio, meses cerrados ni posteriores al fin. Total 1000 a 3 cuotas suma exactamente 1000. **Afecta:** FE-06.1–06.3.

## GAP-02 · P0 · Copia de ingresos con fechas y deduplicación

**Evidencia:** incomes/incomes.service.ts, copyFromPreviousMonth, copia todo excepto DEBT_COLLECTION; conserva date/dueDate y permite duplicados. DTO solo fromPeriodId/toPeriodId.

**Trabajo API:** ajustar fechas a destino, excluir cobros vinculados, validar propiedad y destino abierto; idempotencia por origen/destino/item. Acordar selección de nómina/otros con producto antes de ampliar DTO.

**Aceptación:** 31 de enero ajusta al último día de febrero, isReceived=false, origen intacto y dos peticiones no duplican. **Afecta:** FE-07.6.

## GAP-03 · P0 · Totales persistidos y acarreo coherentes

**Evidencia:** IncomesService.create/update/remove/copy no sincroniza BudgetPeriod; ExpensesService.syncBudgetTotals sí recalcula cuando cambia un gasto. initializePeriod usa totales persistidos del mes anterior; BudgetMetricsService calcula desde movimientos. Edición directa /income o /:year/:month puede divergir de summary.

**Trabajo API:** definir fuente única para saldo/acarreo, recalcular desde movimientos o mantener agregados coherentes en todas las mutaciones; evitar escrituras concurrentes inconsistentes. Definir significado del ahorro proyectado/efectivo con producto.

**Aceptación:** crear solo nómina 15000 sin gasto y abrir mes siguiente arrastra 15000 bajo política proyectada; editar/eliminar/copiar ingreso conserva acuerdo entre historial, summary y acarreo. No arreglarlo sobrescribiendo totales desde navegador. **Afecta:** FE-05.2/05.3, FE-07.4–07.6.

## GAP-04 · P0 · Liquidación real y abonos

**Evidencia:** PeopleService.settleDebt persiste solo si recibe expenseId; amount y recurringTemplateId pueden responder éxito sin actualizar saldo. No verifica que expenseId pertenezca a la persona indicada; markSplitAsPaid marca todo recibido, no registra parcial.

**Trabajo API:** validar persona/usuario/gasto, persistir abonos con saldo e historial, distinguir liquidación completa de parcial y evitar doble registro. Definir contrato de recibo y reversión; rechazar cuerpos sin operación soportada.

**Aceptación:** deuda 1000, abono 300 deja 700; repetición no duplica; gasto de otra persona se rechaza; liquidación completa conserva ingreso recibido. **Afecta:** FE-04.3/04.4.

## GAP-05 · P0 · Resumen de deuda sin duplicados y fechas reales

**Evidencia:** PeopleService.getDebtsSummary combina plantillas activas y todos los gastos pendientes; plantillas usan nombres genéricos y nextDueDate=null; immediateDueAmount no filtra un periodo concreto. Existe riesgo de doble conteo al materializar cuotas.

**Trabajo API:** definir principal MSI futuro frente a cuota instanciada, agrupar por obligación sin duplicar y consultar tarjetas/fechas reales. No proyectar infinitamente servicios sin término. Identificar explícitamente periodo inmediato y cuotas impagadas de planes completados.

**Aceptación:** un MSI con cuota materializada se cuenta una vez, fechas de varias tarjetas son correctas, la última cuota pendiente sigue visible tras completar plantilla y monto inmediato excluye futuro lejano. **Afecta:** FE-04.2, FE-08.3.

## GAP-06 · P0 · Cancelación, adelanto y conservación de cobros

**Evidencia:** RecurringService.advanceMsi/cancel solo cambia plantilla/contador; no movimiento de pago ni sincronización de Income/Expense. ExpensesService.remove conserva ingresos recibidos, pero update con split=null elimina ingreso vinculado sin verificar isReceived.

**Trabajo API:** separar cancelar compra, pagar anticipadamente, perdonar deuda y retirar participación futura; registrar efecto financiero de adelanto, reconciliar proyecciones y conservar recibidos. Definir reversiones con trazabilidad.

**Aceptación:** liquidación registra importe real, cancela cuotas futuras y no elimina cobros recibidos; perdonar pendiente elimina únicamente proyección correspondiente. Dos solicitudes no adelantan dos veces. **Afecta:** FE-04.4, FE-06.4/06.5, FE-07.2.

## GAP-07 · P0 · Cierre y pertenencia de referencias

**Evidencia:** DTOs validan formato de periodId/personId/cardId, pero servicios de movimientos no garantizan siempre pertenencia/estado OPEN de referencias. BudgetsService cambia status sin impedir escrituras posteriores en otros módulos.

**Trabajo API:** validar usuario dueño y estado de todas las entidades referenciadas en alta, edición, copia, instanciación y liquidación; aplicar bloqueo de cierre en servidor.

**Aceptación:** IDs válidos de otro usuario o mes CLOSED se rechazan sin efectos; cerrar con formulario abierto impide guardar incluso vía API directa. **Afecta:** todas las mutaciones financieras, especialmente FE-05.4. Es puerta de salida global aunque no se repita en cada ticket.

## GAP-08 · P1 · Imputación y cambios de fecha/tarjeta

**Evidencia:** ExpensesService.create calcula paymentDueDate pero conserva periodId enviado; fallos de tarjeta/preview se silencian. Al quitar/cambiar tarjeta, el vencimiento anterior puede persistir si no se reemplaza explícitamente.

**Trabajo API:** aclarar quién selecciona periodo y validar coherencia con preview; definir limpiar vencimiento al quitar tarjeta y manejar error de referencia. La UI confirma destino y no promete reasignación automática.

**Aceptación:** compra posterior al corte muestra y guarda periodo acordado; cambiar a efectivo no conserva fecha bancaria errónea; referencia inválida produce error útil. **Afecta:** FE-03.3, FE-07.1.

## GAP-09 · P0 · Sincronización integral del split

**Evidencia:** ExpensesService.update no sincroniza todos los cambios de periodo, vencimiento, título o vínculo inverso al agregar split; mover gasto sincroniza solo periodo destino. DTO de split no impone máximo 100 ni fijo <= monto. CRUD de ingresos puede alterar vínculos independientemente.

**Trabajo API:** operación coherente de gasto/ingreso con integridad de referencias; validaciones de rangos también en servidor y actualización de periodos origen/destino. Evitar borrado/edición independiente de cobros vinculados que deje deuda huérfana.

**Aceptación:** modificar fecha, tarjeta, persona o periodo conserva IDs, importe, vencimiento y referencias en ambas direcciones; 101% se rechaza y ambos resúmenes quedan correctos. **Afecta:** FE-07.2/07.3/07.5.

## GAP-10 · P1 · Moneda sin falsa conversión

**Evidencia:** RecurringTemplate guarda currency/exchangeRate; Income y Expense no contienen moneda y métricas suman amount sin conversión.

**Trabajo API/producto:** definir moneda única por usuario y restricciones de cambio, o persistir moneda original/tasa/monto base por movimiento. Propuesta inicial: MXN y sin mezcla de divisas.

**Aceptación:** no sumar 100 USD como 100 MXN ni cambiar históricos al editar perfil. **Afecta:** FE-02.4 y plantillas.

## GAP-11 · P1 · Sesiones simultáneas y revocación

**Evidencia:** AuthService.updateRefreshTokenHash almacena un hash por usuario; login/refresh reemplaza el anterior. No hay logout en AuthController.

**Trabajo API:** sesiones por dispositivo con rotación/revocación independientes si se exige persistencia multidispositivo. El logout BFF puede terminar su sesión, pero no revoca por sí mismo un token upstream extraído previamente.

**Aceptación:** refrescar iPhone no expulsa iPad; logout revoca esa sesión y no las demás. **Afecta:** FE-02.2. Primera integración puede reautenticar cuando cambie el hash, documentándolo.

## GAP-12 · P1 · Preferencias y privacidad de recordatorios

**Evidencia:** NotificationsController no ofrece preferencias por usuario, listado de dispositivos ni historial consultable general; users PATCH solo nombre/moneda. Baja push requiere endpoint concreto.

**Trabajo API:** si se requieren, persistir opt-in por canal/horario/zona, contenido privado de pantalla bloqueada y revocación de dispositivo ligada a logout. Resolver baja fallida sin dejar avisos financieros a la cuenta anterior.

**Aceptación:** apagar canal persiste tras reinstalar; cambiar de usuario no recibe mensajes de la cuenta anterior; push denegado no impide correo. **Afecta:** FE-02.2, FE-09.3/09.4. No presentar switches ficticios.

## GAP-13 · P1 · Todos los recurrentes y remanente personal

**Evidencia:** ExpenseCategory carece de OTHER_RECURRING; métricas incluyen solo SERVICE/SUBSCRIPTION/MSI y restan únicamente REGULAR_EXPENSE. Plantilla no define frecuencia configurable ni día de vencimiento dedicado.

**Trabajo API/producto:** acordar clasificación de otros compromisos, categorías personales y frecuencia/fecha de servicios; separar tipo de recurrencia de categoría si hace falta. Definir si se resta gasto completo o parte propia sin contar reembolso como nómina.

**Aceptación:** un compromiso recurrente adicional reduce remanente acordado; gastos FOOD/SHOPPING siguen regla explícita; factura variable y vencimiento quedan registrados. **Afecta:** FE-06.1, FE-08.2. Fórmula actual se muestra rotulada hasta ampliar.

## GAP-14 · P0 · Recordatorios con fechas reales

**Evidencia:** due-reminder-scheduler.service.ts compara rangos Date con campos de fecha String de Expense/Income; requiere prueba integrada para verificar casting/orden. Para tarjetas usa new Date con paymentDueDay sin ajuste explícito al último día del mes y amount=0 como placeholder; cron 08:00 sin zona por usuario.

**Trabajo API:** normalizar fecha civil/timestamp en consulta, ajustar días 29–31, establecer zona de negocio y distinguir monto desconocido de cero. Validar ventana 0–3 días y deduplicación por canal/obligación.

**Aceptación:** febrero, año bisiesto, cambio de mes/zona, pagos ya hechos y cobros vencidos generan/omiten avisos según política, con prueba de integración MongoDB y entrega controlada. **Afecta:** FE-09.5; no se afirma que todas las consultas fallen sin ejecutarlas.

## GAP-15 · P1 · Créditos distintos de MSI (alcance a aclarar)

**Evidencia:** no hay módulo/controlador de préstamos con intereses en el árbol revisado. El objetivo sí menciona recordatorios de créditos.

**Trabajo producto/API:** confirmar si basta registrar un gasto de cuota con vencimiento o se requieren capital, interés, plazo, amortización y liquidación. Diseñar contrato y ticket frontend de detalle/calendario tras esa respuesta.

**Aceptación mínima:** una cuota de crédito registrada tiene monto, fecha, estado y recordatorio; si hay amortización, saldo/capital/interés concilian con calendario acordado. **Afecta:** FE-09.5 y agenda FE-08.3; no prometer motor de crédito existente.

# Feature 07: Ingresos, gastos y división de compras

## Objetivo

Gestionar movimientos en secciones separadas con fuentes, fechas y deudas vinculadas.

Estado: planeada. Los checklists describen trabajo futuro; no certifican implementación.

Referencia API: [feature equivalente](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/features/07-transactions-and-splits).

## Integración

CRUD /api/incomes y /api/expenses; POST /api/incomes/copy-from-previous-month.

Aplican [contratos](../../integration.md), [decisiones](../../decisions.md) y [criterios globales de calidad](../../quality.md). Las dependencias GAP remiten al [registro de diferencias](../../api-gaps.md).

## Historias de usuario

### HU-FE-07.1: Capturar gastos

> Como usuario de Budget-APP, quiero agregar gastos con categoría y fecha, para organizar mis compras del mes.

Criterios de aceptación:

- [ ] Lista por fecha y tarjetas de gasto con monto, categoría, tarjeta, vencimiento y pagado/pendiente.
- [ ] Alta con title, amount>=0.01, category, date, periodId y campos opcionales reales.
- [ ] Con tarjeta se consulta preview y se confirma periodo de impacto; sin tarjeta permite vencimiento explícito.

### HU-FE-07.2: Editar, pagar y eliminar gastos

> Como usuario de Budget-APP, quiero corregir o eliminar egresos y marcar pagos, para mantener cifras actualizadas.

Criterios de aceptación:

- [ ] Editar conserva campos no modificados; isPaid marca pago al banco, no cobro al tercero.
- [ ] Borrar confirma título, monto y efecto en ingreso vinculado; error mantiene el registro.
- [ ] Gasto de plantilla explica edición del mes frente a plantilla; cambiar de periodo reconsulta origen y destino.

### HU-FE-07.3: Dividir por cantidad o porcentaje

> Como usuario de Budget-APP, quiero asignar parte de una compra a una persona, para saber cuánto debe reembolsarme.

Criterios de aceptación:

- [ ] Una persona por gasto con splitType PERCENTAGE/FIXED y splitValue; porcentaje >0 y <=100, fijo >0 y <=monto.
- [ ] Previsualizar gasto completo, parte de tercero y parte propia con centavos; API confirma monto final.
- [ ] Ingreso DEBT_COLLECTION aparece vinculado y pendiente; edición de split actualiza importe/persona y no crea ingreso manual adicional.

### HU-FE-07.4: Alta de ingresos por fuente

> Como usuario de Budget-APP, quiero registrar nómina, depósitos y otros ingresos, para distinguir mi sueldo de cobros y proyecciones.

Criterios de aceptación:

- [ ] Sección Ingresos separada, filtros fuente/recibido y fecha; PAYROLL, DEPOSIT, DEBT_COLLECTION, INVESTMENT, OTHER.
- [ ] Alta title, amount, date, source y periodId; ingreso esperado isReceived=false y cobrado true.
- [ ] Ingreso de deuda automática tiene origen visible y no se duplica con captura manual.

### HU-FE-07.5: Editar y eliminar ingresos

> Como usuario de Budget-APP, quiero corregir ingresos y registrar que llegaron, para mantener fiel mi presupuesto.

Criterios de aceptación:

- [ ] PATCH/DELETE para ingresos independientes con confirmación de eliminación.
- [ ] Recibir ingreso independiente actualiza isReceived; vinculado a gasto conduce a liquidación de persona.
- [ ] No permitir romper linkedExpenseId ni borrar cobro recibido vinculado mediante formulario genérico.

### HU-FE-07.6: Copiar ingresos al siguiente mes

> Como usuario de Budget-APP, quiero reutilizar ingresos del mes previo, para evitar capturarlos desde cero.

Criterios de aceptación:

- [ ] Previsualizar origen, destino e ingresos a copiar; excluir DEBT_COLLECTION; explicar alcance real del endpoint.
- [ ] Ajustar fechas al destino y último día válido; nuevos ingresos pendientes de recibir.
- [ ] Repetir operación o recuperarse de timeout no duplica registros; conservar originales.

## Tickets técnicos

### TICKET-FE-07.1: Capturar gastos

Historia: HU-FE-07.1 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-05.1, FE-03.1, FE-01.4. Dependencias de API: GAP-08.

Implementación:

- [ ] Implementar GET con periodId y category; filtros locales por tarjeta/estado sin inventar paginación de servidor.
- [ ] Formulario responsive con selector de categoría del enum real; prevenir fechas inválidas y periodos cerrados.
- [ ] Verificar: Alta 1000 aparece en el mes indicado; preview no mueve el gasto a otro periodo sin decisión explícita.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-07.2: Editar, pagar y eliminar gastos

Historia: HU-FE-07.2 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-07.1. Dependencias de API: GAP-09, GAP-06.

Implementación:

- [ ] Implementar detalle/PATCH/DELETE y confirmación; invalidación de todas las proyecciones afectadas.
- [ ] Antes de borrar o desvincular mostrar si ingreso ya recibido y bloquear caminos inconsistentes hasta GAP-06/GAP-09.
- [ ] Verificar: Editar 1000 a 1200 recalcula resumen; borrar gasto con cobro pendiente quita el ingreso; cobro recibido se conserva según política.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-07.3: Dividir por cantidad o porcentaje

Historia: HU-FE-07.3 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-07.1, FE-04.1. Dependencias de API: GAP-09.

Implementación:

- [ ] Crear editor reutilizable para gastos, MSI y recurrentes con nombres reales splitType/splitValue.
- [ ] Mostrar vínculo al ingreso y acción Ver deuda; quitar split usa null solo en contrato de actualización verificado.
- [ ] Verificar: Gasto 1000 al 40% crea un ingreso de 400; fijo 1200 se rechaza; cambiar porcentaje actualiza ingreso único.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-07.4: Alta de ingresos por fuente

Historia: HU-FE-07.4 · Prioridad: P0 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-05.1, FE-01.4. Dependencias de API: GAP-03.

Implementación:

- [ ] Crear repositorio y formularios de ingreso; adaptar dueDate/debtorPersonId opcionales.
- [ ] Refrescar summary al crear aun cuando totalIncome persistido del periodo no se actualice.
- [ ] Verificar: Crear nómina esperada 25000 y recibirla cambia efectivo, conservando balance proyectado.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-07.5: Editar y eliminar ingresos

Historia: HU-FE-07.5 · Prioridad: P0 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-07.4. Dependencias de API: GAP-03, GAP-09.

Implementación:

- [ ] Implementar detalle, edición, recibido/pendiente y borrado; invalidar resumen y periodo.
- [ ] Aplicar bloqueo de mes cerrado y guardas por vínculo.
- [ ] Verificar: Editar depósito 500 a 600 y borrarlo cambia resumen; cobro vinculado dirige al gasto/persona.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-07.6: Copiar ingresos al siguiente mes

Historia: HU-FE-07.6 · Prioridad: P1 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-07.4, FE-05.1. Dependencias de API: GAP-02, GAP-03.

Implementación:

- [ ] Integrar fromPeriodId/toPeriodId tras GAP-02; mostrar resultado persistido y lista editable.
- [ ] La API actual copia todos los no DEBT_COLLECTION; selección individual o solo nómina requiere ampliación, no enviar IDs no soportados.
- [ ] Verificar: Copiar 31/01 a febrero ajusta día; deuda no se copia; doble envío genera una sola copia.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

## Verificación de la feature

Ejecutar los escenarios de cada ticket con fixtures sintéticos, casos de error y dispositivos de la matriz de calidad. Un ticket con GAP puede avanzar en diseño y pruebas con fixtures, pero no se considera integrado hasta cerrar su dependencia y ejecutar el contrato contra staging.

[Volver al índice](../../README.md)

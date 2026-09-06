# Alcance y decisiones

## Entrega actual

Crear toda la planeación del frontend, no implementar la aplicación ni modificar Budget-API. El repositorio local estaba sin aplicación y con README.md no seguido por Git; se conserva ese archivo. Los tickets quedan en archivos locales para revisión y posterior implementación.

## Decisiones de trabajo

| Tema | Decisión propuesta y razón |
|---|---|
| Direcciones | Interpretar el texto final como `https://budget.jonmb.com/app` para frontend y `https://budget.jonmb.com/api` para API; el enlace de la app en el objetivo apunta por error a /api. `/` redirige a `/app`. |
| Arquitectura | React/Next.js App Router con servidor Node; BFF en `/app/bff`, NestJS existente conserva lógica financiera y MongoDB. El frontend no conecta directamente a MongoDB. |
| Idioma y dinero | Español, es-MX y MXN como valor inicial propuesto; fecha civil YYYY-MM-DD. La zona de negocio inicial propuesta es America/Mexico_City, pendiente de alinear en API/VPS. |
| Sesión | Almacén de sesiones del servidor con TTL, cookie opaca; API key y JWT fuera del navegador. Diseño deliberadamente distinto del ejemplo Vite/localStorage de docs/README de la API. |
| Navegación | Inferior en teléfono, superior en iPad/Mac con adaptación al ancho en ventanas divididas. Inicio, Ingresos, Gastos y Más; selector de mes persistente en URL. |
| Interfaz | Tarjetas, listas por fecha, acordeones, barras y agenda. Verde/azul/rojo oscuros, sin tablas tipo spreadsheet para operar las finanzas. |
| Actualización | Reconsultar tras guardar y al recuperar foco/conexión; no hay transmisión de eventos verificada. No prometer sincronización instantánea entre dispositivos. |
| Offline | Shell público y aviso de conexión; no guardar ni encolar operaciones financieras offline en primera versión. |
| División | Una persona por compra/plantilla, consistente con el contrato. Varios deudores en una misma compra es ampliación futura. |
| Fechas de tarjetas | Preview del servidor como fuente; confirmar mes presupuestario de impacto. El POST de gasto no reasigna automáticamente periodId. |
| Deuda pagada | Cobrar mantiene el ingreso como recibido. Perdonar/cancelar quita únicamente proyecciones pendientes según política por acordar; no borrar un cobro histórico por haber terminado una deuda. |
| Automatización | Responsabilidad del backend: materialización mensual idempotente. La app inicia o consulta el proceso; no avanza contadores por montar una pantalla. |
| Totales | Summary es fuente financiera; no ofrecer edición libre de totalIncome/totalExpenses además del CRUD de movimientos, aunque la API tenga esos endpoints. |
| Alcance adicional | Registro por invitación, perfil, cierre/reapertura, accesibilidad, estados de error, recuperación de solicitudes y revisión de consistencia completan el funcionamiento. |

## Preguntas de producto antes de implementar los flujos afectados

No bloquean la planeación. Las propuestas permiten diseñar y estimar; las preguntas que cambian significado contable deben resolverse antes de habilitar esos flujos.

1. **Ahorro:** ¿acarrear saldo proyectado (incluye ingresos aún no recibidos), como describe la API, o efectivo efectivamente recibido menos pagos? Propuesta de compatibilidad: proyectado, rotulado como tal; distinguir efectivo en Inicio. Afecta FE-05.3 y GAP-03.
2. **Nómina libre:** ¿descontar todas las categorías de gasto personal además de REGULAR_EXPENSE y todos los recurrentes? Propuesta para el objetivo: todos los compromisos recurrentes, con desglose; adaptar la API sin cambiar fórmula solo en pantalla. Afecta GAP-13.
3. **Copiar ingresos:** ¿todos los ingresos no ligados a deudas, solo nómina o selección individual? Propuesta: nómina seleccionable y otros ingresos opcionales; requiere ampliar GAP-02. El ticket de compatibilidad muestra claramente alcance actual.
4. **Fin de deuda:** ¿al cancelar un MSI se cancela la compra, se perdona a la persona o se paga anticipadamente? Propuesta: tres acciones separadas con importes y alcance, preservando movimientos recibidos. Afecta FE-04.4 y GAP-06.
5. **Servicios:** ¿agua/luz se cobran también bimestralmente, y hace falta recordatorio con fecha editable distinta de la tarjeta? Propuesta: mensual en primera integración y vencimiento explícito por factura; frecuencia configurable es extensión GAP-13.
6. **Créditos:** ¿hay préstamos con intereses, además de tarjetas y MSI? No hay entidad ni cálculo de crédito identificado. Propuesta: registrar pagos como gastos y ampliar modelo si se necesitan capital, intereses y calendario; GAP-15.
7. **Histórico inicial:** ¿se migrará la hoja de Google Sheets y desde qué mes? No se proporcionó hoja. Propuesta: captura inicial manual; importar CSV/Sheets requiere muestra, mapeo, vista previa y deduplicación, y se estima por separado.
8. **Notificaciones y dispositivos:** ¿avisos por usuario con horarios/canales elegibles y sesiones simultáneas independientes? Propuesta: sí como evolución; la API actual no ofrece preferencias personales ni sesiones independientes de refresh. GAP-11/GAP-12.

## Fuera del contrato actual

Sin conexión bancaria, conciliación bancaria, pagos reales, OCR, categorías personalizadas, reparto entre varias personas, importación de Sheets, recuperación de contraseña ni transferencias entre cuentas verificadas. No aparecen como funciones implementadas. Los requisitos expresos de préstamos/recordatorios y todos los recurrentes sí se mantienen como dependencias, no se descartan por faltar en la API.

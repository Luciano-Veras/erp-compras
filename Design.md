# Documentación de Diseño y Arquitectura del Sistema
## Control de Compras, Trazabilidad e Inventario de Materia Prima (PyME de Producción Masiva de Tortas)

---

### 1. Resumen del Sistema
Esta aplicación es un sistema colaborativo y full-stack diseñado para la gestión integral de abastecimiento, control de stock, backorders y trazabilidad de materias primas para una PyME pastelera industrial.

El sistema garantiza que la recepción de insumos (harina, azúcares, lácteos, huevos, esencias, chocolates, empaques) quede asociada a lotes internos únicos con fecha de caducidad, auditoría de operario y asignación posterior a lotes de producción de tortas.

---

### 2. Esquemas de Datos (Firestore Collections)

#### A. Colección `suppliers` (Proveedores)
- `id` (string): Identificador único del proveedor.
- `name` (string): Nombre de la empresa o razón social.
- `contactEmail` (string): Correo electrónico para el envío de Órdenes de Compra.
- `phone` (string): Teléfono de contacto.
- `address` (string): Dirección física de entrega / fiscal.
- `suppliedItemIds` (array of strings): IDs de las materias primas que provee.
- `avgLeadTimeDays` (number): Días promedio de entrega.
- `fulfillmentRate` (number): Porcentaje de pedidos completos entregados (0-100%).
- `createdAt` (timestamp): Fecha de creación.

#### B. Colección `ingredients` (Materias Primas / Insumos)
- `id` (string): ID único del ingrediente.
- `name` (string): Nombre del insumo (ej: Harina 0000, Manteca sin sal, Crema de Leche).
- `category` (string): Categoría (Lácteos, Harinas, Secos, Huevos, Chocolates, Empaques, Coberturas).
- `unit` (string): Unidad de medida (`kg`, `litros`, `unidades`, `gramos`).
- `currentStock` (number): Stock físico total disponible.
- `minStock` (number): Nivel de stock mínimo de seguridad.
- `reorderQuantity` (number): Cantidad estándar sugerida para reorden.
- `preferredSupplierIds` (array of strings): Proveedores vinculados con precios de referencia.
- `unitCost` (number): Costo unitario de referencia.
- `updatedAt` (timestamp): Última actualización de stock.

#### C. Colección `purchaseOrders` (Órdenes de Compra)
- `id` (string): Código de OC (ej: `OC-2026-001`).
- `supplierId` (string): ID del proveedor seleccionado.
- `supplierName` (string): Nombre del proveedor.
- `supplierEmail` (string): Email del proveedor.
- `status` (string): Estado (`Borrador`, `Enviada`, `Recepción Parcial`, `Completo`, `Cerrado Incompleto`).
- `items` (array): Lista de ítems:
  - `ingredientId` (string)
  - `ingredientName` (string)
  - `unit` (string)
  - `orderedQuantity` (number)
  - `receivedQuantity` (number)
  - `unitPrice` (number)
  - `subtotal` (number)
- `totalAmount` (number): Importe total.
- `createdAt` (timestamp): Fecha de emisión.
- `createdByUid` (string): ID del usuario creador.
- `createdByName` (string): Nombre del usuario creador.

#### D. Colección `lots` (Trazabilidad y Lotes de Insumos)
- `id` (string): ID del registro de lote.
- `internalLotNumber` (string): Código de lote interno (ej: `LOT-20260726-HAR-01`).
- `supplierLotNumber` (string): Código de lote asignado por el proveedor.
- `ingredientId` (string): ID de la materia prima.
- `ingredientName` (string): Nombre de la materia prima.
- `purchaseOrderId` (string): ID de la OC origen.
- `quantityReceived` (number): Cantidad recibida en este lote.
- `quantityRemaining` (number): Cantidad disponible actual de este lote.
- `unit` (string): Unidad de medida.
- `expirationDate` (string YYYY-MM-DD): Fecha de vencimiento del lote.
- `receivedAt` (timestamp): Fecha y hora exacta de recepción.
- `receivedByUid` (string): ID del operario autenticado.
- `receivedByName` (string): Nombre del operario autenticado.
- `assignedProductionBatches` (array): Historial de uso en tortas:
  - `productionBatchId` (string) (ej: `PROD-TORTA-CHARLOTTE-20260726-01`)
  - `cakeType` (string) (ej: `Torta Rogel`, `Torta Selva Negra`, `Mousse de Chocolate`)
  - `quantityUsed` (number)
  - `assignedAt` (timestamp)
  - `assignedBy` (string)

#### E. Colección `backorders` (Pedidos Pendientes)
- `id` (string): ID del registro de backorder.
- `purchaseOrderId` (string): ID de la OC original.
- `supplierId` (string): ID del proveedor.
- `supplierName` (string): Nombre del proveedor.
- `ingredientId` (string): ID del insumo faltante.
- `ingredientName` (string): Nombre del insumo.
- `orderedQuantity` (number): Cantidad ordenada en la OC.
- `receivedQuantity` (number): Cantidad parcial entregada.
- `pendingQuantity` (number): Cantidad que falta recibir.
- `unit` (string): Unidad.
- `status` (string): Estado (`Pendiente Reclamo`, `Reclamado`, `Entregado`, `Cancelado`).
- `createdAt` (timestamp): Fecha de generación.
- `claimNotes` (string): Notas o texto del reclamo enviado.

---

### 3. Arquitectura del Sistema

```
[Cliente React 19 + Tailwind CSS]
      │
      ├── AuthService (Firebase Auth - Google Sign-In)
      ├── DbService (Firebase Firestore - NoSQL Sync)
      ├── Components UI:
      │     ├── MainContent (Manejador principal de vistas)
      │     ├── Header (Navegación + Perfil Usuario Google + Alertas Rápidas)
      │     ├── Dashboard/
      │     │     ├── DashboardView (Ensamblador)
      │     │     ├── DashboardStats (Tarjetas métricas)
      │     │     ├── DashboardCharts (Gráficos Recharts)
      │     │     ├── CriticalStockTable (Alertas Stock)
      │     │     └── PendingBackordersTable (Resumen Backorders)
      │     ├── Suppliers/
      │     │     └── SuppliersView (Catálogo de Proveedores y Materias Primas)
      │     ├── PurchaseOrders/
      │     │     ├── PurchaseOrdersView (Manejador principal de OCs)
      │     │     ├── PurchaseOrderForm (Elaboración de OC)
      │     │     ├── PurchaseOrderList (Historial)
      │     │     └── EmailDraftModal (Borrador de Email)
      │     ├── Receiving/
      │     │     ├── ReceivingView (Recepción de Pedidos y Backorders)
      │     │     ├── ReceivingFormModal (Formulario Trazabilidad)
      │     │     └── ReceivingSuccessModal (Mensaje de Éxito y Lote)
      │     ├── Traceability/
      │     │     └── TraceabilityView (Lotes Proveedor/Interno, Vencimientos, Asignación)
      │     ├── Backorders/
      │     │     └── BackordersView (Gestión de Reclamos a Proveedores)
      │     └── TestSimulation/
      │           └── TestSimulationPanel (Ejecución de Pruebas de Integración y Reglas)
      └── Utils (Formatos, Generadores de Códigos Lote, Redacción de Emails)
```

---

### 4. Seguridad
- Reglas de Firestore desplegadas en `firestore.rules` restringiendo lectura y escritura a usuarios autenticados.
- Validación cliente-servidor de ID de usuario y nombre registrado en cada auditoría de recepción e inventario.

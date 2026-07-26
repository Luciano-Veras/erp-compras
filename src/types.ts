/**
 * @file src/types.ts
 * @description Definiciones de interfaces TypeScript y tipos de datos principales
 * para el sistema de gestión de compras, trazabilidad e inventario de materias primas.
 */

/**
 * Representa un proveedor registrado en el catálogo.
 */
export interface Supplier {
  /** Identificador único del proveedor en Firestore */
  id: string;
  /** Nombre o razón social del proveedor */
  name: string;
  /** Correo electrónico de contacto para enviar Órdenes de Compra y reclamos */
  contactEmail: string;
  /** Teléfono de contacto */
  phone: string;
  /** Dirección física/fiscal del proveedor */
  address: string;
  /** Lista de IDs de materias primas que este proveedor suministra */
  suppliedItemIds: string[];
  /** Tiempo promedio de demora en días para entrega */
  avgLeadTimeDays?: number;
  /** Porcentaje estimado de cumplimiento (0 a 100%) */
  fulfillmentRate?: number;
  /** Fecha de creación o actualización */
  createdAt?: string;
}

/**
 * Representa una materia prima o ingrediente en el inventario.
 */
export interface Ingredient {
  /** Identificador único de la materia prima */
  id: string;
  /** Nombre descriptivo del ingrediente (ej: Harina 0000, Manteca, Crema) */
  name: string;
  /** Categoría del insumo (ej: Lácteos, Harinas, Secos, Empaques) */
  category: string;
  /** Unidad de medida principal: 'kg' | 'litros' | 'unidades' | 'gramos' */
  unit: 'kg' | 'litros' | 'unidades' | 'gramos' | string;
  /** Cantidad actual disponible en el stock físico */
  currentStock: number;
  /** Cantidad mínima de seguridad requerida */
  minStock: number;
  /** Cantidad estándar de reorden cuando se alcanza el stock mínimo */
  reorderQuantity: number;
  /** IDs de proveedores preferidos o alternativos */
  preferredSupplierIds: string[];
  /** Costo unitario de referencia en la moneda local */
  unitCost: number;
  /** Fecha de última actualización de inventario */
  updatedAt?: string;
}

/**
 * Ítem individual dentro de una Orden de Compra.
 */
export interface PurchaseOrderItem {
  /** ID de la materia prima asociada */
  ingredientId: string;
  /** Nombre del ingrediente (denormalizado para velocidad) */
  ingredientName: string;
  /** Unidad de medida */
  unit: string;
  /** Cantidad solicitada en la orden */
  orderedQuantity: number;
  /** Cantidad efectivamente recibida en la recepción */
  receivedQuantity: number;
  /** Precio unitario pactado para este ítem */
  unitPrice: number;
  /** Subtotal calculado (orderedQuantity * unitPrice) */
  subtotal: number;
}

/**
 * Estados posibles para una Orden de Compra.
 */
export type POStatus = 
  | 'Borrador' 
  | 'Enviada' 
  | 'Recepción Parcial' 
  | 'Completo' 
  | 'Cerrado Incompleto';

/**
 * Representa una Orden de Compra (OC).
 */
export interface PurchaseOrder {
  /** Identificador único o código de la OC (ej: OC-2026-001) */
  id: string;
  /** ID del proveedor destinatario */
  supplierId: string;
  /** Nombre del proveedor */
  supplierName: string;
  /** Correo del proveedor */
  supplierEmail: string;
  /** Estado actual de la orden */
  status: POStatus;
  /** Lista de ítems o insumos comprados */
  items: PurchaseOrderItem[];
  /** Importe total de la orden */
  totalAmount: number;
  /** Observaciones o notas especiales */
  notes?: string;
  /** Fecha de emisión (ISO string o Timestamp) */
  createdAt: string;
  /** ID del usuario que creó la orden */
  createdByUid: string;
  /** Nombre del usuario creador */
  createdByName: string;
}

/**
 * Registro de asignación de un lote de insumo a una tirada/lote de producción de tortas.
 */
export interface LotProductionAssignment {
  /** Identificador único del registro de asignación */
  id: string;
  /** Código del lote de producción de la torta (ej: PROD-TORTA-CHARLOTTE-20260726-01) */
  productionBatchId: string;
  /** Tipo de torta o receta producida (ej: Torta Rogel, Selva Negra) */
  cakeType: string;
  /** Cantidad de ingrediente consumida del lote en esta producción */
  quantityUsed: number;
  /** Unidad de medida */
  unit: string;
  /** Fecha y hora de la asignación */
  assignedAt: string;
  /** Nombre del pastelero u operario que realizó la asignación */
  assignedBy: string;
}

/**
 * Representa un lote recibido de materia prima con trazabilidad completa.
 */
export interface Lot {
  /** Identificador único del lote en Firestore */
  id: string;
  /** Número de Lote Interno autogenerado por el sistema (ej: LOT-20260726-HAR-01) */
  internalLotNumber: string;
  /** Número de Lote asignado por el Proveedor */
  supplierLotNumber: string;
  /** ID del ingrediente asociado */
  ingredientId: string;
  /** Nombre de la materia prima */
  ingredientName: string;
  /** ID de la Orden de Compra origen */
  purchaseOrderId: string;
  /** Cantidad originalmente recibida en este lote */
  quantityReceived: number;
  /** Cantidad restante disponible en este lote específico */
  quantityRemaining: number;
  /** Unidad de medida */
  unit: string;
  /** Fecha de vencimiento ingresada (YYYY-MM-DD) */
  expirationDate: string;
  /** Fecha y hora exacta de recepción en planta */
  receivedAt: string;
  /** ID del usuario/operario autenticado que registró el lote */
  receivedByUid: string;
  /** Nombre del operario autenticado */
  receivedByName: string;
  /** Historial de tiradas de producción de tortas en que fue utilizado */
  assignedProductionBatches?: LotProductionAssignment[];
}

/**
 * Representa un registro de Backorder (pedido pendiente por entregar parcialmente por el proveedor).
 */
export interface Backorder {
  /** Identificador único del backorder en Firestore */
  id: string;
  /** ID de la Orden de Compra original */
  purchaseOrderId: string;
  /** ID del proveedor */
  supplierId: string;
  /** Nombre del proveedor */
  supplierName: string;
  /** ID del ingrediente pendiente */
  ingredientId: string;
  /** Nombre del ingrediente pendiente */
  ingredientName: string;
  /** Cantidad solicitada originalmente */
  orderedQuantity: number;
  /** Cantidad recibida parcialmente */
  receivedQuantity: number;
  /** Cantidad pendiente de entrega (orderedQuantity - receivedQuantity) */
  pendingQuantity: number;
  /** Unidad de medida */
  unit: string;
  /** Estado del reclamo: 'Pendiente Reclamo' | 'Reclamado' | 'Entregado' | 'Cancelado' */
  status: 'Pendiente Reclamo' | 'Reclamado' | 'Entregado' | 'Cancelado';
  /** Fecha de creación del registro de backorder */
  createdAt: string;
  /** Texto o detalle del reclamo generado para el proveedor */
  claimNotes?: string;
}

/**
 * Usuario autenticado en el sistema.
 */
export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

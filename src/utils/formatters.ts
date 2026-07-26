/**
 * @file src/utils/formatters.ts
 * @description Funciones auxiliares de formateo de fechas, generación de códigos de lotes y redacción automática de correos electrónicos.
 */

import { PurchaseOrder, Backorder, Supplier } from '../types';

/**
 * Formatea un monto numérico a formato de moneda local.
 * 
 * @param {number} amount Importe numérico a formatear.
 * @returns {string} Texto formateado en moneda (ej: "$ 12.500,00").
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Formatea una cadena o Timestamp a fecha legible en español.
 * 
 * @param {string} dateString Cadena de fecha ISO o YYYY-MM-DD.
 * @returns {string} Fecha formateada (ej: "26 jul 2026").
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Calcula los días faltantes para el vencimiento de una fecha dada.
 * 
 * @param {string} expirationDate Date string en formato YYYY-MM-DD.
 * @returns {number} Número de días restantes (negativo si ya venció).
 */
export function getDaysUntilExpiration(expirationDate: string): number {
  if (!expirationDate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDate);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determina el estado de urgencia de vencimiento para destacarlo visualmente.
 * 
 * @param {string} expirationDate Fecha de vencimiento.
 * @returns {'expired' | 'critical' | 'warning' | 'good'} Categoría de urgencia.
 */
export function getExpirationStatus(expirationDate: string): 'expired' | 'critical' | 'warning' | 'good' {
  const days = getDaysUntilExpiration(expirationDate);
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'good';
}

/**
 * Genera un código de Lote Interno automático basado en la fecha y el nombre del ingrediente.
 * 
 * @param {string} ingredientName Nombre de la materia prima.
 * @returns {string} Código de lote interno (ej: LOT-20260726-HAR-3891).
 */
export function generateInternalLotNumber(ingredientName: string): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  
  // Clean prefix from ingredient name (first 3 alphanumeric letters uppercase)
  const cleanName = ingredientName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3) || 'INS';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  
  return `LOT-${dateStr}-${cleanName}-${randomSuffix}`;
}

/**
 * Genera un código único para una nueva Orden de Compra.
 * 
 * @returns {string} Código de OC (ej: OC-2026-8492).
 */
export function generatePOCode(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `OC-${year}-${num}`;
}

/**
 * Genera un código automático para un Lote de Producción de Tortas.
 * 
 * @param {string} cakeType Nombre o tipo de la torta.
 * @returns {string} Código de lote de producción (ej: PROD-ROGEL-20260726-102).
 */
export function generateProductionBatchCode(cakeType: string): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  
  const cakeCode = cakeType.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5) || 'TORTA';
  const rand = Math.floor(100 + Math.random() * 900);
  return `PROD-${cakeCode}-${dateStr}-${rand}`;
}

/**
 * Redacta un borrador de correo electrónico profesional para enviar una Orden de Compra al proveedor.
 * 
 * @param {PurchaseOrder} po Objeto con la información de la Orden de Compra.
 * @returns {string} Texto completo del correo listo para copiar.
 */
export function generatePOEmailDraft(po: PurchaseOrder): string {
  const itemsList = po.items
    .map((item, idx) => `  ${idx + 1}. ${item.ingredientName}: ${item.orderedQuantity} ${item.unit} x $${item.unitPrice.toFixed(2)} = $${item.subtotal.toFixed(2)}`)
    .join('\n');

  return `ASUNTO: Orden de Compra N° ${po.id} - PyME Pastelería Industrial

Estimado/a representante de ${po.supplierName},

Por medio de la presente, solicitamos formalmente la emisión y despacho de la Orden de Compra N° ${po.id} detallada a continuación:

DETALLE DE INSUMOS SOLICITADOS:
--------------------------------------------------------------------------------
${itemsList}
--------------------------------------------------------------------------------
IMPORTE TOTAL ESTIMADO: ${formatCurrency(po.totalAmount)}

CONDICIONES DE ENTREGA Y CALIDAD:
- Agradecemos confirmar fecha estimada de entrega a la brevedad.
- Es requisito obligatorio entregar cada materia prima con su correspondiente NÚMERO DE LOTE DE ORIGEN y FECHA DE VENCIMIENTO visibles en el empaque.
- Dirección de recepción: Planta Industrial Pastelería - Área de Depósito e Insumos.

Emitido por: ${po.createdByName} (${po.createdAt ? formatDate(po.createdAt) : 'Hoy'})
Cualquier duda o modificación, favor de responder a este correo.

Atentamente,
Departamento de Compras y Logística
`;
}

/**
 * Redacta un borrador de reclamo formal para un artículo pendiente (Backorder) de entrega.
 * 
 * @param {Backorder} backorder Registro de backorder.
 * @returns {string} Texto redactado del reclamo.
 */
export function generateClaimEmailDraft(backorder: Backorder): string {
  return `ASUNTO: RECLAMO DE PENDIENTE DE ENTREGA (BACKORDER) - OC N° ${backorder.purchaseOrderId}

Estimados ${backorder.supplierName},

Nos comunicamos del Departamento de Compras de la Planta Pastelera en relación a la Orden de Compra N° ${backorder.purchaseOrderId}.

Al efectuar la recepción física en nuestra planta, hemos detectado un faltante en la entrega correspondiente al siguiente insumo:

- Materia Prima: ${backorder.ingredientName}
- Cantidad Solicitada en OC: ${backorder.orderedQuantity} ${backorder.unit}
- Cantidad Efectivamente Recibida: ${backorder.receivedQuantity} ${backorder.unit}
- CANTIDAD FALTANTE A ENTREGAR: ${backorder.pendingQuantity} ${backorder.unit}

Dado que este insumo es crítico para mantener la continuidad del programa de producción masiva de tortas, solicitamos nos indiquen con urgencia la fecha estimada para la entrega del remanente indicado.

Quedamos a la espera de su pronta respuesta.

Atentamente,
Control de Calidad y Recepción de Insumos
`;
}

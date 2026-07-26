/**
 * @file src/services/dbService.ts
 * @description Servicio centralizado para todas las operaciones CRUD y suscripciones en tiempo real con Firebase Firestore.
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  setDoc,
  writeBatch,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  Supplier, 
  Ingredient, 
  PurchaseOrder, 
  Lot, 
  Backorder, 
  LotProductionAssignment,
  POStatus 
} from '../types';
import { generateInternalLotNumber } from '../utils/formatters';

// Nombres de colecciones en Firestore
const SUPPLIERS_COL = 'suppliers';
const INGREDIENTS_COL = 'ingredients';
const PURCHASE_ORDERS_COL = 'purchaseOrders';
const LOTS_COL = 'lots';
const BACKORDERS_COL = 'backorders';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

// ==========================================
// SUSCRIPCIONES EN TIEMPO REAL
// ==========================================

/**
 * Suscribe a los cambios en la colección de Proveedores.
 * 
 * @param {(suppliers: Supplier[]) => void} callback Función receptora de los datos actualizados.
 * @returns {() => void} Cancelador de la suscripción (unsubscribe).
 */
export function subscribeSuppliers(callback: (suppliers: Supplier[]) => void): () => void {
  const q = query(collection(db, SUPPLIERS_COL), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list: Supplier[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Supplier));
    callback(list);
  }, (err) => {
    console.error('Error en suscripción a proveedores:', err);
    handleFirestoreError(err, OperationType.GET, SUPPLIERS_COL);
  });
}

/**
 * Suscribe a los cambios en el catálogo de Materias Primas / Ingredientes.
 * 
 * @param {(ingredients: Ingredient[]) => void} callback Función receptora del inventario.
 * @returns {() => void} Cancelador de suscripción.
 */
export function subscribeIngredients(callback: (ingredients: Ingredient[]) => void): () => void {
  const q = query(collection(db, INGREDIENTS_COL), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list: Ingredient[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Ingredient));
    callback(list);
  }, (err) => {
    console.error('Error en suscripción a ingredientes:', err);
    handleFirestoreError(err, OperationType.GET, INGREDIENTS_COL);
  });
}

/**
 * Suscribe a los cambios en las Órdenes de Compra.
 * 
 * @param {(orders: PurchaseOrder[]) => void} callback Función receptora de las órdenes.
 * @returns {() => void} Cancelador de suscripción.
 */
export function subscribePurchaseOrders(callback: (orders: PurchaseOrder[]) => void): () => void {
  const q = query(collection(db, PURCHASE_ORDERS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: PurchaseOrder[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    } as PurchaseOrder));
    callback(list);
  }, (err) => {
    console.error('Error en suscripción a Órdenes de Compra:', err);
    handleFirestoreError(err, OperationType.GET, PURCHASE_ORDERS_COL);
  });
}

/**
 * Suscribe a los cambios en el registro de Lotes de Trazabilidad.
 * 
 * @param {(lots: Lot[]) => void} callback Función receptora del listado de lotes.
 * @returns {() => void} Cancelador de suscripción.
 */
export function subscribeLots(callback: (lots: Lot[]) => void): () => void {
  const q = query(collection(db, LOTS_COL), orderBy('receivedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Lot[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Lot));
    callback(list);
  }, (err) => {
    console.error('Error en suscripción a lotes:', err);
    handleFirestoreError(err, OperationType.GET, LOTS_COL);
  });
}

/**
 * Suscribe a los cambios en los registros de Backorders (Pedidos Pendientes).
 * 
 * @param {(backorders: Backorder[]) => void} callback Función receptora de backorders.
 * @returns {() => void} Cancelador de suscripción.
 */
export function subscribeBackorders(callback: (backorders: Backorder[]) => void): () => void {
  const q = query(collection(db, BACKORDERS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Backorder[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Backorder));
    callback(list);
  }, (err) => {
    console.error('Error en suscripción a backorders:', err);
    handleFirestoreError(err, OperationType.GET, BACKORDERS_COL);
  });
}

// ==========================================
// ACCIONES PARA PROVEEDORES
// ==========================================

/**
 * Agrega o actualiza un Proveedor en Firestore.
 * 
 * @param {Omit<Supplier, 'id'> & { id?: string }} supplierData Datos del proveedor.
 * @returns {Promise<string>} ID del documento guardado.
 */
export async function saveSupplier(supplierData: Omit<Supplier, 'id'> & { id?: string }): Promise<string> {
  if (supplierData.id) {
    const ref = doc(db, SUPPLIERS_COL, supplierData.id);
    const { id, ...data } = supplierData;
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return supplierData.id;
  } else {
    const ref = await addDoc(collection(db, SUPPLIERS_COL), {
      ...supplierData,
      createdAt: new Date().toISOString(),
      avgLeadTimeDays: supplierData.avgLeadTimeDays || 3,
      fulfillmentRate: supplierData.fulfillmentRate || 95
    });
    return ref.id;
  }
}

/**
 * Elimina un proveedor por su ID.
 * 
 * @param {string} id ID del proveedor.
 */
export async function deleteSupplier(id: string): Promise<void> {
  await deleteDoc(doc(db, SUPPLIERS_COL, id));
}

// ==========================================
// ACCIONES PARA INGREDIENTES / MATERIA PRIMA
// ==========================================

/**
 * Registra o edita una Materia Prima / Ingrediente en el inventario.
 * 
 * @param {Omit<Ingredient, 'id'> & { id?: string }} ingredientData Datos del ingrediente.
 * @returns {Promise<string>} ID del documento en Firestore.
 */
export async function saveIngredient(ingredientData: Omit<Ingredient, 'id'> & { id?: string }): Promise<string> {
  if (ingredientData.id) {
    const ref = doc(db, INGREDIENTS_COL, ingredientData.id);
    const { id, ...data } = ingredientData;
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return ingredientData.id;
  } else {
    const ref = await addDoc(collection(db, INGREDIENTS_COL), {
      ...ingredientData,
      updatedAt: new Date().toISOString()
    });
    return ref.id;
  }
}

/**
 * Elimina un ingrediente del catálogo.
 * 
 * @param {string} id ID del ingrediente.
 */
export async function deleteIngredient(id: string): Promise<void> {
  await deleteDoc(doc(db, INGREDIENTS_COL, id));
}

/**
 * Actualiza el stock de un ingrediente.
 * 
 * @param {string} ingredientId ID del ingrediente.
 * @param {number} delta Cantidad a sumar (o restar si es negativo).
 */
export async function updateIngredientStock(ingredientId: string, delta: number): Promise<void> {
  const ingRef = doc(db, INGREDIENTS_COL, ingredientId);
  await updateDoc(ingRef, {
    currentStock: increment(delta),
    updatedAt: new Date().toISOString()
  });
}

// ==========================================
// ACCIONES PARA ÓRDENES DE COMPRA
// ==========================================

/**
 * Crea una nueva Orden de Compra en estado Borrador o Enviada.
 * 
 * @param {Omit<PurchaseOrder, 'id'> & { id?: string }} poData Datos de la OC.
 * @returns {Promise<string>} ID de la orden.
 */
export async function createPurchaseOrder(poData: PurchaseOrder): Promise<string> {
  const ref = doc(db, PURCHASE_ORDERS_COL, poData.id);
  await setDoc(ref, {
    ...poData,
    createdAt: poData.createdAt || new Date().toISOString()
  });
  return poData.id;
}

/**
 * Actualiza el estado de una Orden de Compra.
 * 
 * @param {string} poId ID de la Orden de Compra.
 * @param {POStatus} status Nuevo estado.
 */
export async function updatePOStatus(poId: string, status: POStatus): Promise<void> {
  const ref = doc(db, PURCHASE_ORDERS_COL, poId);
  await updateDoc(ref, { status });
}

/**
 * Elimina una Orden de Compra de Firestore.
 * 
 * @param {string} poId ID de la Orden de Compra a eliminar.
 */
export async function deletePurchaseOrder(poId: string): Promise<void> {
  await deleteDoc(doc(db, PURCHASE_ORDERS_COL, poId));
}

// ==========================================
// MÓDULO CRÍTICO: RECEPCIÓN Y TRAZABILIDAD
// ==========================================

/**
 * Parámetros para procesar la recepción física de un ítem de una Orden de Compra.
 */
export interface ReceiveItemInput {
  po: PurchaseOrder;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
  supplierLotNumber: string;
  expirationDate: string;
  expectRemaining: boolean;
  operatorUid: string;
  operatorName: string;
}

/**
 * Procesa la recepción física de una materia prima recibida en la planta:
 * 1. Incrementa el stock físico global del ingrediente.
 * 2. Genera un lote interno único y guarda el registro de Trazabilidad.
 * 3. Si la cantidad recibida es inferior a la ordenada y se espera el saldo, crea o actualiza el Backorder correspondiente.
 * 4. Actualiza las cantidades e incentiva la actualización del estado de la OC.
 * 
 * @param {ReceiveItemInput} input Datos ingresados por el operario.
 * @returns {Promise<{ internalLotNumber: string; backorderCreated: boolean }>} Resultado del proceso.
 */
export async function processItemReceipt(input: ReceiveItemInput): Promise<{ internalLotNumber: string; backorderCreated: boolean }> {
  // 0. Consultar si ya existe un registro de Backorder para esta OC y materia prima
  const backordersQuery = query(
    collection(db, BACKORDERS_COL),
    where('purchaseOrderId', '==', input.po.id),
    where('ingredientId', '==', input.ingredientId)
  );
  const backorderSnap = await getDocs(backordersQuery);

  const batch = writeBatch(db);

  // 1. Generar número de Lote Interno automático
  const internalLotNumber = generateInternalLotNumber(input.ingredientName);

  // 2. Crear documento de Lote en 'lots'
  const lotRef = doc(collection(db, LOTS_COL));
  const lotData: Omit<Lot, 'id'> = {
    internalLotNumber,
    supplierLotNumber: input.supplierLotNumber || 'S/L',
    ingredientId: input.ingredientId,
    ingredientName: input.ingredientName,
    purchaseOrderId: input.po.id,
    quantityReceived: input.receivedQty,
    quantityRemaining: input.receivedQty,
    unit: input.unit,
    expirationDate: input.expirationDate,
    receivedAt: new Date().toISOString(),
    receivedByUid: input.operatorUid,
    receivedByName: input.operatorName,
    assignedProductionBatches: []
  };
  batch.set(lotRef, lotData);

  // 3. Actualizar stock actual en 'ingredients'
  const ingRef = doc(db, INGREDIENTS_COL, input.ingredientId);
  batch.update(ingRef, {
    currentStock: increment(input.receivedQty),
    updatedAt: new Date().toISOString()
  });

  // 4. Actualizar la cantidad recibida en la OC
  const updatedItems = input.po.items.map(item => {
    if (item.ingredientId === input.ingredientId) {
      return {
        ...item,
        receivedQuantity: (item.receivedQuantity || 0) + input.receivedQty
      };
    }
    return item;
  });

  // Evaluar estado general de la OC
  let isFullyReceived = true;
  let hasPartial = false;

  updatedItems.forEach(item => {
    if (item.receivedQuantity < item.orderedQuantity) {
      isFullyReceived = false;
      if (item.receivedQuantity > 0) hasPartial = true;
    } else {
      if (item.receivedQuantity > 0) hasPartial = true;
    }
  });

  const newPOStatus: POStatus = isFullyReceived 
    ? 'Completo' 
    : (hasPartial || input.expectRemaining ? 'Recepción Parcial' : 'Cerrado Incompleto');

  const poRef = doc(db, PURCHASE_ORDERS_COL, input.po.id);
  batch.update(poRef, {
    items: updatedItems,
    status: newPOStatus
  });

  // 5. Crear o Actualizar Backorder
  let backorderCreated = false;
  const targetItem = updatedItems.find(i => i.ingredientId === input.ingredientId);
  const totalReceivedSoFar = targetItem ? targetItem.receivedQuantity : input.receivedQty;
  const pendingQty = Math.max(0, input.orderedQty - totalReceivedSoFar);

  if (!backorderSnap.empty) {
    // Si ya existía un backorder registrado para este insumo de esta OC, actualizar sus valores
    const existingBoDoc = backorderSnap.docs[0];
    const newStatus = pendingQty <= 0 ? 'Entregado' : 'Pendiente Reclamo';

    batch.update(existingBoDoc.ref, {
      receivedQuantity: totalReceivedSoFar,
      pendingQuantity: pendingQty,
      status: newStatus
    });
  } else if (pendingQty > 0 && input.expectRemaining) {
    // Si no existía backorder y aún falta entregar saldo y el operario espera que entreguen el resto
    backorderCreated = true;
    const backorderRef = doc(collection(db, BACKORDERS_COL));
    const backorderData: Omit<Backorder, 'id'> = {
      purchaseOrderId: input.po.id,
      supplierId: input.po.supplierId,
      supplierName: input.po.supplierName,
      ingredientId: input.ingredientId,
      ingredientName: input.ingredientName,
      orderedQuantity: input.orderedQty,
      receivedQuantity: totalReceivedSoFar,
      pendingQuantity: pendingQty,
      unit: input.unit,
      status: 'Pendiente Reclamo',
      createdAt: new Date().toISOString()
    };
    batch.set(backorderRef, backorderData);
  }

  // Ejecutar el lote de escritura en Firestore
  await batch.commit();

  return { internalLotNumber, backorderCreated };
}

/**
 * Asigna y consume parte de la cantidad de un Lote de Materia Prima hacia un Lote de Producción de Tortas.
 * 
 * @param {string} lotId ID del lote de ingrediente.
 * @param {string} productionBatchId Código del lote de producción de torta.
 * @param {string} cakeType Nombre de la torta (ej: Torta Rogel, Selva Negra).
 * @param {number} quantityToUse Cantidad consumida del lote.
 * @param {string} operatorName Nombre del pastelero que realiza la asignación.
 */
export async function assignLotToCakeProduction(
  lotId: string,
  ingredientId: string,
  productionBatchId: string,
  cakeType: string,
  quantityToUse: number,
  operatorName: string
): Promise<void> {
  const batch = writeBatch(db);

  const lotRef = doc(db, LOTS_COL, lotId);
  const ingRef = doc(db, INGREDIENTS_COL, ingredientId);

  const assignment: LotProductionAssignment = {
    id: 'ASG-' + Math.floor(Math.random() * 100000),
    productionBatchId,
    cakeType,
    quantityUsed: quantityToUse,
    unit: '',
    assignedAt: new Date().toISOString(),
    assignedBy: operatorName
  };

  // Descontar del lote específico y guardar la asignación
  batch.update(lotRef, {
    quantityRemaining: increment(-quantityToUse),
    assignedProductionBatches: [assignment]
  });

  // Descontar del stock global del ingrediente
  batch.update(ingRef, {
    currentStock: increment(-quantityToUse),
    updatedAt: new Date().toISOString()
  });

  await batch.commit();
}

/**
 * Actualiza el estado o notas de reclamo de un Backorder.
 * 
 * @param {string} backorderId ID del backorder.
 * @param {'Pendiente Reclamo' | 'Reclamado' | 'Entregado' | 'Cancelado'} status Nuevo estado.
 * @param {string} claimNotes Texto opcional del reclamo enviado.
 */
export async function updateBackorderStatus(
  backorderId: string, 
  status: 'Pendiente Reclamo' | 'Reclamado' | 'Entregado' | 'Cancelado',
  claimNotes?: string
): Promise<void> {
  const ref = doc(db, BACKORDERS_COL, backorderId);
  await updateDoc(ref, {
    status,
    ...(claimNotes !== undefined ? { claimNotes } : {})
  });
}

// ==========================================
// CARGA INICIAL DE DATOS DE PRUEBA (SEED DEMO DATA)
// ==========================================

/**
 * Pobla la base de datos Firestore con datos iniciales realistas para la producción de tortas
 * si la base de datos se encuentra vacía o a solicitud del usuario.
 * 
 * @returns {Promise<void>}
 */
export async function seedInitialDemoData(): Promise<void> {
  const suppliersSnap = await getDocs(collection(db, SUPPLIERS_COL));
  if (!suppliersSnap.empty) {
    console.log('La base de datos ya contiene información. Omitiendo seed automático.');
    return;
  }

  const batch = writeBatch(db);

  // 1. Proveedores
  const supp1Ref = doc(collection(db, SUPPLIERS_COL));
  const supp1 = {
    name: 'Molinos Cañuelas S.A.',
    contactEmail: 'ventas@molinoscanuelas.com',
    phone: '+54 11 4321-8800',
    address: 'Av. Industrial 1250, Buenos Aires',
    suppliedItemIds: [],
    avgLeadTimeDays: 2,
    fulfillmentRate: 98,
    createdAt: new Date().toISOString()
  };
  batch.set(supp1Ref, supp1);

  const supp2Ref = doc(collection(db, SUPPLIERS_COL));
  const supp2 = {
    name: 'Lácteos La Serenísima',
    contactEmail: 'pedidos.pyme@laserenisima.com.ar',
    phone: '+54 11 4780-9900',
    address: 'Ruta 5 Km 68, General Rodríguez',
    suppliedItemIds: [],
    avgLeadTimeDays: 1,
    fulfillmentRate: 94,
    createdAt: new Date().toISOString()
  };
  batch.set(supp2Ref, supp2);

  const supp3Ref = doc(collection(db, SUPPLIERS_COL));
  const supp3 = {
    name: 'Chocolates & Coberturas Fénix',
    contactEmail: 'comercial@chocolatesfenix.com',
    phone: '+54 11 4552-1122',
    address: 'Calle San Martín 340, San Isidro',
    suppliedItemIds: [],
    avgLeadTimeDays: 3,
    fulfillmentRate: 88,
    createdAt: new Date().toISOString()
  };
  batch.set(supp3Ref, supp3);

  // 2. Ingredientes
  const ing1Ref = doc(collection(db, INGREDIENTS_COL));
  const ing1 = {
    name: 'Harina 0000 Pastelería',
    category: 'Harinas',
    unit: 'kg',
    currentStock: 450,
    minStock: 200,
    reorderQuantity: 500,
    preferredSupplierIds: [supp1Ref.id],
    unitCost: 850,
    updatedAt: new Date().toISOString()
  };
  batch.set(ing1Ref, ing1);

  const ing2Ref = doc(collection(db, INGREDIENTS_COL));
  const ing2 = {
    name: 'Manteca Sin Sal Extra',
    category: 'Lácteos',
    unit: 'kg',
    currentStock: 35, // Por debajo del minStock de 80 -> Alerta!
    minStock: 80,
    reorderQuantity: 150,
    preferredSupplierIds: [supp2Ref.id],
    unitCost: 6200,
    updatedAt: new Date().toISOString()
  };
  batch.set(ing2Ref, ing2);

  const ing3Ref = doc(collection(db, INGREDIENTS_COL));
  const ing3 = {
    name: 'Crema de Leche 44% MG',
    category: 'Lácteos',
    unit: 'litros',
    currentStock: 120,
    minStock: 100,
    reorderQuantity: 200,
    preferredSupplierIds: [supp2Ref.id],
    unitCost: 4100,
    updatedAt: new Date().toISOString()
  };
  batch.set(ing3Ref, ing3);

  const ing4Ref = doc(collection(db, INGREDIENTS_COL));
  const ing4 = {
    name: 'Coagulado de Chocolate Semiamargo 60%',
    category: 'Chocolates',
    unit: 'kg',
    currentStock: 18, // En alerta!
    minStock: 50,
    reorderQuantity: 100,
    preferredSupplierIds: [supp3Ref.id],
    unitCost: 11500,
    updatedAt: new Date().toISOString()
  };
  batch.set(ing4Ref, ing4);

  const ing5Ref = doc(collection(db, INGREDIENTS_COL));
  const ing5 = {
    name: 'Azúcar Refinada Tipo A',
    category: 'Secos',
    unit: 'kg',
    currentStock: 600,
    minStock: 300,
    reorderQuantity: 600,
    preferredSupplierIds: [supp1Ref.id],
    unitCost: 920,
    updatedAt: new Date().toISOString()
  };
  batch.set(ing5Ref, ing5);

  // Vincular productos a proveedores
  batch.update(supp1Ref, { suppliedItemIds: [ing1Ref.id, ing5Ref.id] });
  batch.update(supp2Ref, { suppliedItemIds: [ing2Ref.id, ing3Ref.id] });
  batch.update(supp3Ref, { suppliedItemIds: [ing4Ref.id] });

  // 3. Órdenes de Compra de Ejemplo
  const po1Ref = doc(collection(db, PURCHASE_ORDERS_COL), 'OC-2026-101');
  batch.set(po1Ref, {
    id: 'OC-2026-101',
    supplierId: supp2Ref.id,
    supplierName: 'Lácteos La Serenísima',
    supplierEmail: 'pedidos.pyme@laserenisima.com.ar',
    status: 'Recepción Parcial',
    items: [
      {
        ingredientId: ing2Ref.id,
        ingredientName: 'Manteca Sin Sal Extra',
        unit: 'kg',
        orderedQuantity: 150,
        receivedQuantity: 100,
        unitPrice: 6200,
        subtotal: 930000
      },
      {
        ingredientId: ing3Ref.id,
        ingredientName: 'Crema de Leche 44% MG',
        unit: 'litros',
        orderedQuantity: 200,
        receivedQuantity: 200,
        unitPrice: 4100,
        subtotal: 820000
      }
    ],
    totalAmount: 1750000,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdByUid: 'demo-user-1',
    createdByName: 'Luciano Veras (Jefe de Planta)'
  });

  // 4. Backorder pendiente
  const bo1Ref = doc(collection(db, BACKORDERS_COL));
  batch.set(bo1Ref, {
    purchaseOrderId: 'OC-2026-101',
    supplierId: supp2Ref.id,
    supplierName: 'Lácteos La Serenísima',
    ingredientId: ing2Ref.id,
    ingredientName: 'Manteca Sin Sal Extra',
    orderedQuantity: 150,
    receivedQuantity: 100,
    pendingQuantity: 50,
    unit: 'kg',
    status: 'Pendiente Reclamo',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  });

  // 5. Lotes con trazabilidad y próximos a vencer
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 5 * 86400000).toISOString().split('T')[0]; // Próximo a vencer en 5 días
  const nextMonth = new Date(today.getTime() + 45 * 86400000).toISOString().split('T')[0];

  const lot1Ref = doc(collection(db, LOTS_COL));
  batch.set(lot1Ref, {
    internalLotNumber: 'LOT-20260724-CRE-8812',
    supplierLotNumber: 'LS-CREMA-09221',
    ingredientId: ing3Ref.id,
    ingredientName: 'Crema de Leche 44% MG',
    purchaseOrderId: 'OC-2026-101',
    quantityReceived: 200,
    quantityRemaining: 120,
    unit: 'litros',
    expirationDate: nextWeek, // Alerta visual de vencimiento próximo
    receivedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    receivedByUid: 'demo-user-1',
    receivedByName: 'Luciano Veras',
    assignedProductionBatches: [
      {
        id: 'ASG-001',
        productionBatchId: 'PROD-SELVA-20260725-01',
        cakeType: 'Torta Selva Negra Industrial (50 unidades)',
        quantityUsed: 80,
        unit: 'litros',
        assignedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        assignedBy: 'Luciano Veras'
      }
    ]
  });

  const lot2Ref = doc(collection(db, LOTS_COL));
  batch.set(lot2Ref, {
    internalLotNumber: 'LOT-20260720-HAR-4102',
    supplierLotNumber: 'MOL-HAR-99210',
    ingredientId: ing1Ref.id,
    ingredientName: 'Harina 0000 Pastelería',
    purchaseOrderId: 'OC-2026-090',
    quantityReceived: 500,
    quantityRemaining: 450,
    unit: 'kg',
    expirationDate: nextMonth,
    receivedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    receivedByUid: 'demo-user-1',
    receivedByName: 'Operario Pedro Gómez',
    assignedProductionBatches: []
  });

  await batch.commit();
  console.log('Seed de datos iniciales completado exitosamente.');
}

import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Send, AlertCircle } from 'lucide-react';
import { Supplier, Ingredient, PurchaseOrderItem, PurchaseOrder, UserProfile } from '../../types';
import { createPurchaseOrder } from '../../services/dbService';
import { generatePOCode, formatCurrency } from '../../utils/formatters';

interface PurchaseOrderFormProps {
  suppliers: Supplier[];
  ingredients: Ingredient[];
  currentUser: UserProfile | null;
  preselectedIngredient?: Ingredient | null;
  onCancel: () => void;
  onSuccess: (newPO: PurchaseOrder) => void;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  suppliers,
  ingredients,
  currentUser,
  preselectedIngredient,
  onCancel,
  onSuccess
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [poNotes, setPoNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedIngredient) {
      const supplierId = preselectedIngredient.preferredSupplierIds?.[0] || suppliers[0]?.id || '';
      setSelectedSupplierId(supplierId);
      setOrderItems([{
        ingredientId: preselectedIngredient.id,
        ingredientName: preselectedIngredient.name,
        unit: preselectedIngredient.unit,
        orderedQuantity: preselectedIngredient.reorderQuantity || 100,
        receivedQuantity: 0,
        unitPrice: preselectedIngredient.unitCost || 0,
        subtotal: (preselectedIngredient.reorderQuantity || 100) * (preselectedIngredient.unitCost || 0)
      }]);
    } else if (suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [preselectedIngredient, suppliers]);

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const availableIngredients = ingredients.filter(i => {
    if (!selectedSupplierId) return false;
    const isPreferred = i.preferredSupplierIds?.includes(selectedSupplierId);
    const isSupplied = selectedSupplier?.suppliedItemIds?.includes(i.id);
    if (isPreferred || isSupplied) return true;
    const supplierHasList = selectedSupplier?.suppliedItemIds && selectedSupplier.suppliedItemIds.length > 0;
    const ingredientHasList = i.preferredSupplierIds && i.preferredSupplierIds.length > 0;
    if (!supplierHasList && !ingredientHasList) return true;
    return false;
  });

  const handleAddItem = () => {
    if (availableIngredients.length === 0) return;
    const firstIng = availableIngredients[0];
    const newItem: PurchaseOrderItem = {
      ingredientId: firstIng.id,
      ingredientName: firstIng.name,
      unit: firstIng.unit,
      orderedQuantity: firstIng.reorderQuantity || 100,
      receivedQuantity: 0,
      unitPrice: firstIng.unitCost || 0,
      subtotal: (firstIng.reorderQuantity || 100) * (firstIng.unitCost || 0)
    };
    setOrderItems([...orderItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...orderItems];
    const item = { ...updated[index] };

    if (field === 'ingredientId') {
      const ing = ingredients.find(i => i.id === value);
      if (ing) {
        item.ingredientId = ing.id;
        item.ingredientName = ing.name;
        item.unit = ing.unit;
        item.unitPrice = ing.unitCost || 0;
        item.orderedQuantity = ing.reorderQuantity || 100;
        item.subtotal = item.orderedQuantity * item.unitPrice;
      }
    } else if (field === 'orderedQuantity') {
      item.orderedQuantity = Math.max(1, Number(value));
      item.subtotal = item.orderedQuantity * item.unitPrice;
    } else if (field === 'unitPrice') {
      item.unitPrice = Math.max(0, Number(value));
      item.subtotal = item.orderedQuantity * item.unitPrice;
    }
    updated[index] = item;
    setOrderItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const totalAmount = orderItems.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleSavePO = async () => {
    if (!selectedSupplierId || orderItems.length === 0) {
      alert('Por favor seleccione un proveedor y al menos una materia prima.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPO: PurchaseOrder = {
        id: generatePOCode(),
        supplierId: selectedSupplierId,
        supplierName: selectedSupplier?.name || 'Proveedor General',
        supplierEmail: selectedSupplier?.contactEmail || '',
        status: 'Enviada',
        items: orderItems,
        totalAmount,
        notes: poNotes,
        createdAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || 'invitado',
        createdByName: currentUser?.displayName || 'Operario Pastelero'
      };

      await createPurchaseOrder(newPO);
      onSuccess(newPO);
    } catch (err) {
      console.error('Error al generar la Orden de Compra:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-900/60 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Borrador de Orden de Compra
        </h3>
        <button onClick={onCancel} className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Seleccionar Proveedor *</label>
          <select
            value={selectedSupplierId}
            onChange={(e) => { setSelectedSupplierId(e.target.value); setOrderItems([]); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="" disabled>-- Seleccione un proveedor --</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.contactEmail})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Observaciones / Instrucciones de Entrega</label>
          <input
            type="text"
            placeholder="Ej: Entregar en horario matutino de 8 a 12 hs"
            value={poNotes}
            onChange={(e) => setPoNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>

      {selectedSupplierId && availableIngredients.length === 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>El proveedor seleccionado no tiene materias primas asignadas.</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Detalle de Materias Primas Solicitadas</h4>
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!selectedSupplierId || availableIngredients.length === 0}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> <span>Añadir Ingrediente</span>
          </button>
        </div>

        {orderItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs">
            Haga clic en "+ Añadir Ingrediente" para incluir insumos a esta orden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3">Materia Prima</th>
                  <th className="p-3 w-32">Cantidad</th>
                  <th className="p-3 w-24">Unidad</th>
                  <th className="p-3 w-36">Precio Unit. ($)</th>
                  <th className="p-3 w-36">Subtotal ($)</th>
                  <th className="p-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orderItems.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2">
                      <select
                        value={item.ingredientId}
                        onChange={(e) => handleUpdateItem(index, 'ingredientId', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      >
                        {availableIngredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name} ({ing.category})</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={1}
                        value={item.orderedQuantity}
                        onChange={(e) => handleUpdateItem(index, 'orderedQuantity', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-right font-bold"
                      />
                    </td>
                    <td className="p-2 text-slate-500 font-medium">{item.unit}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(index, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-right font-semibold"
                      />
                    </td>
                    <td className="p-2 font-bold text-slate-900 dark:text-white text-right">
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => handleRemoveItem(index)} className="p-1 text-slate-400 hover:text-rose-600 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-500">
            Creado por: <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser?.displayName || 'Operario de Planta'}</span>
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500">IMPORTE TOTAL</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatCurrency(totalAmount)}</p>
          </div>
          <button
            onClick={handleSavePO}
            disabled={isSubmitting || orderItems.length === 0}
            className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Generando...' : 'Emitir Orden de Compra'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { SearchCode, User, AlertTriangle } from 'lucide-react';
import { Modal } from '../Common/Modal';
import { PurchaseOrder, PurchaseOrderItem, UserProfile } from '../../types';

interface ReceivingFormModalProps {
  selectedItem: PurchaseOrderItem | null;
  selectedPO: PurchaseOrder | null;
  currentUser: UserProfile | null;
  receivedQty: number;
  setReceivedQty: (v: number) => void;
  supplierLotNumber: string;
  setSupplierLotNumber: (v: string) => void;
  expirationDate: string;
  setExpirationDate: (v: string) => void;
  expectRemaining: boolean;
  setExpectRemaining: (v: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

/**
 * Modal para el formulario de recepción.
 * @param {ReceivingFormModalProps} props
 * @returns {JSX.Element}
 */
export const ReceivingFormModal: React.FC<ReceivingFormModalProps> = ({
  selectedItem,
  selectedPO,
  currentUser,
  receivedQty,
  setReceivedQty,
  supplierLotNumber,
  setSupplierLotNumber,
  expirationDate,
  setExpirationDate,
  expectRemaining,
  setExpectRemaining,
  isSubmitting,
  onSubmit,
  onClose
}) => {
  return (
    <Modal
      isOpen={!!selectedItem}
      onClose={onClose}
      title={`Recepción Física - ${selectedItem?.ingredientName}`}
      subtitle={`Asociado a la Orden de Compra N° ${selectedPO?.id}`}
    >
      {selectedItem && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200">Detalles de la Compra:</p>
            <p className="text-slate-600 dark:text-slate-300">Cantidad Total Ordenada: <strong>{selectedItem.orderedQuantity} {selectedItem.unit}</strong></p>
            <p className="text-slate-600 dark:text-slate-300">Previamente Recibido: <strong>{selectedItem.receivedQuantity} {selectedItem.unit}</strong></p>
            <p className="text-amber-700 dark:text-amber-400 font-bold">
              Saldo Faltante: {selectedItem.orderedQuantity - selectedItem.receivedQuantity} {selectedItem.unit}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cantidad Físicamente Entregada en Planta ({selectedItem.unit}) *
            </label>
            <input
              type="number"
              min={1}
              max={selectedItem.orderedQuantity * 2}
              required
              value={receivedQty}
              onChange={(e) => setReceivedQty(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-3">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <SearchCode className="w-4 h-4" />
              Datos Obligatorios de Trazabilidad
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Lote del Proveedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: LOTE-PROV-99182"
                  value={supplierLotNumber}
                  onChange={(e) => setSupplierLotNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  required
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Auditor: <strong>{currentUser?.displayName || 'Operario Autenticado'}</strong></span>
            </div>
          </div>

          {receivedQty < (selectedItem.orderedQuantity - selectedItem.receivedQuantity) && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/60 space-y-2">
              <p className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Entrega Incompleta Detectada
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Faltan <strong>{(selectedItem.orderedQuantity - selectedItem.receivedQuantity) - receivedQty} {selectedItem.unit}</strong> para completar la orden.
              </p>

              <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={expectRemaining}
                  onChange={(e) => setExpectRemaining(e.target.checked)}
                  className="rounded-xs text-amber-500 focus:ring-amber-500"
                />
                <span>¿Se espera que el proveedor entregue el resto de la mercadería? (Creará un Backorder)</span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Ingreso a Planta'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

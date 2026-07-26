import React, { useState } from 'react';
import { PackageCheck, CheckCircle2, Building } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem, UserProfile } from '../../types';
import { processItemReceipt } from '../../services/dbService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../Common/Badge';
import { ReceivingFormModal } from './ReceivingFormModal';
import { ReceivingSuccessModal } from './ReceivingSuccessModal';

interface ReceivingViewProps {
  purchaseOrders: PurchaseOrder[];
  currentUser: UserProfile | null;
}

export const ReceivingView: React.FC<ReceivingViewProps> = ({ purchaseOrders, currentUser }) => {
  const activeOrders = purchaseOrders.filter(p => p.status === 'Enviada' || p.status === 'Recepción Parcial');

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedItem, setSelectedItem] = useState<PurchaseOrderItem | null>(null);

  const [receivedQty, setReceivedQty] = useState<number>(0);
  const [supplierLotNumber, setSupplierLotNumber] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [expectRemaining, setExpectRemaining] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successReceiptInfo, setSuccessReceiptInfo] = useState<{ internalLotNumber: string; backorderCreated: boolean } | null>(null);

  const handleOpenReceiveModal = (po: PurchaseOrder, item: PurchaseOrderItem) => {
    setSelectedPO(po);
    setSelectedItem(item);
    const pending = item.orderedQuantity - item.receivedQuantity;
    setReceivedQty(pending > 0 ? pending : 1);
    setSupplierLotNumber('');
    const defaultExp = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
    setExpirationDate(defaultExp);
    setExpectRemaining(true);
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO || !selectedItem || !supplierLotNumber || !expirationDate) {
      alert('Por favor complete todos los datos obligatorios de trazabilidad.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await processItemReceipt({
        po: selectedPO,
        ingredientId: selectedItem.ingredientId,
        ingredientName: selectedItem.ingredientName,
        unit: selectedItem.unit,
        orderedQty: selectedItem.orderedQuantity,
        receivedQty,
        supplierLotNumber,
        expirationDate,
        expectRemaining,
        operatorUid: currentUser?.uid || 'operario-1',
        operatorName: currentUser?.displayName || 'Operario de Recepción'
      });
      setSuccessReceiptInfo(result);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error al procesar:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-indigo-600" /> Panel de Recepción e Ingreso de Insumos
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ingreso físico de mercadería, generación de Lote Interno automático y control de faltantes (Backorders)</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" size="md">{activeOrders.length} Órdenes en Espera</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeOrders.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">¡Todas las Órdenes Recibidas!</h3>
            <p className="text-xs text-slate-400 mt-1">No hay órdenes de compra pendientes de ingreso físico en planta.</p>
          </div>
        ) : (
          activeOrders.map((po) => (
            <div key={po.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-amber-600 dark:text-amber-400">{po.id}</span>
                    <Badge variant={po.status === 'Recepción Parcial' ? 'warning' : 'info'}>{po.status}</Badge>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {po.supplierName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">{formatDate(po.createdAt)}</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{formatCurrency(po.totalAmount)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Insumos a Ingresar:</p>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  {po.items.map((item, idx) => {
                    const isFullyDelivered = item.receivedQuantity >= item.orderedQuantity;
                    return (
                      <div key={idx} className="p-3 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.ingredientName}</p>
                          <p className="text-[11px] text-slate-500">
                            Pedido: <strong className="text-slate-700 dark:text-slate-300">{item.orderedQuantity} {item.unit}</strong> | Recibido: <span className="font-bold text-emerald-600">{item.receivedQuantity} {item.unit}</span>
                          </p>
                        </div>
                        {isFullyDelivered ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Entregado
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenReceiveModal(po, item)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center gap-1 shrink-0"
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> <span>Registrar Recepción</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ReceivingFormModal
        selectedItem={selectedItem}
        selectedPO={selectedPO}
        currentUser={currentUser}
        receivedQty={receivedQty}
        setReceivedQty={setReceivedQty}
        supplierLotNumber={supplierLotNumber}
        setSupplierLotNumber={setSupplierLotNumber}
        expirationDate={expirationDate}
        setExpirationDate={setExpirationDate}
        expectRemaining={expectRemaining}
        setExpectRemaining={setExpectRemaining}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitReceipt}
        onClose={() => setSelectedItem(null)}
      />

      <ReceivingSuccessModal
        successReceiptInfo={successReceiptInfo}
        onClose={() => setSuccessReceiptInfo(null)}
      />
    </div>
  );
};

import React from 'react';
import { Mail, Trash2 } from 'lucide-react';
import { PurchaseOrder } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Badge } from '../Common/Badge';

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrder[];
  onSelectEmailPO: (po: PurchaseOrder) => void;
  onDeletePO: (poId: string) => void;
}

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  purchaseOrders,
  onSelectEmailPO,
  onDeletePO
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-500 uppercase tracking-wider">
        Historial de Órdenes de Compra Emitidas ({purchaseOrders.length})
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">Código OC</th>
              <th className="p-4">Proveedor</th>
              <th className="p-4">Fecha Emisión</th>
              <th className="p-4">Ítems Solicitados</th>
              <th className="p-4">Importe Total</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No hay órdenes de compra registradas.
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => {
                const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
                  'Completo': 'success',
                  'Recepción Parcial': 'warning',
                  'Enviada': 'info',
                  'Cerrado Incompleto': 'danger',
                  'Borrador': 'neutral'
                };

                return (
                  <tr key={po.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-black text-amber-600 dark:text-amber-400">{po.id}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{po.supplierName}</td>
                    <td className="p-4 text-slate-500">{formatDate(po.createdAt)}</td>

                    <td className="p-4">
                      <span className="font-semibold">{po.items?.length || 0} productos</span>
                      <div className="text-[11px] text-slate-400 max-w-xs truncate">
                        {po.items?.map(i => i.ingredientName).join(', ')}
                      </div>
                    </td>

                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(po.totalAmount)}
                    </td>

                    <td className="p-4">
                      <Badge variant={variantMap[po.status] || 'neutral'}>
                        {po.status}
                      </Badge>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectEmailPO(po)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1.5"
                          title="Ver o copiar borrador de correo"
                        >
                          <Mail className="w-3.5 h-3.5 text-indigo-600" /> <span>Ver Email</span>
                        </button>
                        <button
                          onClick={() => onDeletePO(po.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors inline-flex items-center gap-1"
                          title="Eliminar esta Orden de Compra"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

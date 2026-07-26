import React from 'react';
import { Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Backorder } from '../../types';

interface PendingBackordersTableProps {
  activeBackorders: Backorder[];
  onNavigateTab: (tab: string) => void;
}

/**
 * Tabla de Backorders pendientes.
 * @param {PendingBackordersTableProps} props
 * @returns {JSX.Element}
 */
export const PendingBackordersTable: React.FC<PendingBackordersTableProps> = React.memo(({
  activeBackorders,
  onNavigateTab
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/40 dark:bg-amber-950/20">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Backorders Pendientes (Reclamar a Proveedores)
            </h3>
            <p className="text-xs text-slate-500">Insumos entregados parcialmente esperando saldo</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('backorders')}
          className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
        >
          Gestionar Reclamos <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-80">
        {activeBackorders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Sin Entregas Incompletas</p>
            <p className="text-xs text-slate-400 mt-1">No hay reclamos de backorder pendientes con ningún proveedor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Insumo</th>
                  <th className="py-2.5 px-3">Proveedor / OC</th>
                  <th className="py-2.5 px-3 text-center">Pendiente</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeBackorders.map((bo) => (
                  <tr key={bo.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {bo.ingredientName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      <div className="font-medium text-xs">{bo.supplierName}</div>
                      <div className="text-[10px] text-slate-400">OC: {bo.purchaseOrderId}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                      {bo.pendingQuantity} {bo.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onNavigateTab('backorders')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        Reclamar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

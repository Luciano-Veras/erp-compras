import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Ingredient } from '../../types';

interface CriticalStockTableProps {
  lowStockItems: Ingredient[];
  onNavigateTab: (tab: string) => void;
  onCreatePOWithIngredient?: (ingredient: Ingredient) => void;
}

/**
 * Tabla para mostrar insumos con stock crítico.
 * @param {CriticalStockTableProps} props
 * @returns {JSX.Element}
 */
export const CriticalStockTable: React.FC<CriticalStockTableProps> = React.memo(({
  lowStockItems,
  onNavigateTab,
  onCreatePOWithIngredient
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/40 dark:bg-rose-950/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Alertas de Stock Mínimo de Seguridad
            </h3>
            <p className="text-xs text-slate-500">Materias primas que están en o por debajo del límite crítico</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('suppliers')}
          className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
        >
          Ver Todo Catalog <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-80">
        {lowStockItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">¡Stock Saludable!</p>
            <p className="text-xs text-slate-400 mt-1">Todas las materias primas cuentan con stock por encima del nivel mínimo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Materia Prima</th>
                  <th className="py-2.5 px-3 text-center">Stock Físico</th>
                  <th className="py-2.5 px-3 text-center">Stock Mínimo</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {item.name}
                      <span className="block text-[10px] font-normal text-slate-400">{item.category}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-500 dark:text-slate-400">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onCreatePOWithIngredient && onCreatePOWithIngredient(item)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs inline-flex items-center gap-1"
                      >
                        Reordenar
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

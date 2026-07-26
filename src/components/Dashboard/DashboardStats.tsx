import React from 'react';
import { Layers, AlertTriangle, ShoppingBag, Clock } from 'lucide-react';

interface DashboardStatsProps {
  totalIngredients: number;
  lowStockCount: number;
  activeOrdersCount: number;
  activeBackordersCount: number;
}

/**
 * Muestra tarjetas con las estadísticas principales del Dashboard.
 * @param {DashboardStatsProps} props
 * @returns {JSX.Element}
 */
export const DashboardStats: React.FC<DashboardStatsProps> = React.memo(({
  totalIngredients,
  lowStockCount,
  activeOrdersCount,
  activeBackordersCount
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Materias Primas</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalIngredients}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">En catálogo activo</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alertas Stock Mín.</p>
          <h3 className={`text-3xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {lowStockCount}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Insumos críticos</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-50 dark:bg-red-950/40 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Órdenes Activas</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {activeOrdersCount}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">En tránsito / recepción</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Backorders Hoy</p>
          <h3 className={`text-3xl font-bold mt-1 ${activeBackordersCount > 0 ? 'text-amber-500' : 'text-slate-700'}`}>
            {activeBackordersCount}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Items pendientes</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
});

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface DashboardChartsProps {
  topSpentIngredientsData: any[];
  supplierPerformanceData: any[];
}

const COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

/**
 * Componente que muestra gráficos de Recharts del dashboard.
 * @param {DashboardChartsProps} props
 * @returns {JSX.Element}
 */
export const DashboardCharts: React.FC<DashboardChartsProps> = React.memo(({
  topSpentIngredientsData,
  supplierPerformanceData
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Insumos Más Comprados por Costo Acumulado */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Insumos Principales por Costo Acumulado
            </h3>
            <p className="text-xs text-slate-500">Materia prima con mayor inversión en compras</p>
          </div>
        </div>
        <div className="h-64 w-full">
          {topSpentIngredientsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSpentIngredientsData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Inversión Total']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', backgroundColor: '#0f172a', color: '#fff' }}
                />
                <Bar dataKey="totalSpent" radius={[6, 6, 0, 0]}>
                  {topSpentIngredientsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Aún no hay órdenes de compra registradas.
            </div>
          )}
        </div>
      </div>

      {/* Gráfico 2: Rendimiento de Cumplimiento de Proveedores */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cumplimiento de Proveedores (%)
            </h3>
            <p className="text-xs text-slate-500">Porcentaje de entregas completas en tiempo y forma</p>
          </div>
        </div>
        <div className="h-64 w-full">
          {supplierPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end" 
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(val: any) => [`${val}%`, 'Índice de Cumplimiento']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', backgroundColor: '#0f172a', color: '#fff' }}
                />
                <Bar dataKey="fulfillmentRate" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No hay proveedores registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

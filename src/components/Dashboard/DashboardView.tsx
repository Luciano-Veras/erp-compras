/**
 * @file src/components/Dashboard/DashboardView.tsx
 * @description Panel interactivo de Insights con gráficos Recharts, alertas de stock mínimo y resumen de backorders pendientes.
 */

import React, { useMemo } from 'react';
import { TrendingUp, ShoppingBag } from 'lucide-react';
import { Ingredient, PurchaseOrder, Backorder, Supplier } from '../../types';
import { DashboardStats } from './DashboardStats';
import { DashboardCharts } from './DashboardCharts';
import { CriticalStockTable } from './CriticalStockTable';
import { PendingBackordersTable } from './PendingBackordersTable';

interface DashboardViewProps {
  ingredients: Ingredient[];
  purchaseOrders: PurchaseOrder[];
  backorders: Backorder[];
  suppliers: Supplier[];
  onNavigateTab: (tab: string) => void;
  onCreatePOWithIngredient?: (ingredient: Ingredient) => void;
}

/**
 * Vista de Dashboard principal refactorizada para modularidad.
 * @param {DashboardViewProps} props
 * @returns {JSX.Element}
 */
export const DashboardView: React.FC<DashboardViewProps> = React.memo(({
  ingredients,
  purchaseOrders,
  backorders,
  suppliers,
  onNavigateTab,
  onCreatePOWithIngredient
}) => {
  // 1. Insumos con alerta de stock mínimo
  const lowStockItems = useMemo(() => {
    return ingredients.filter(i => i.currentStock <= i.minStock);
  }, [ingredients]);

  // 2. Backorders pendientes
  const activeBackorders = useMemo(() => {
    return backorders.filter(b => b.status === 'Pendiente Reclamo' || b.status === 'Reclamado');
  }, [backorders]);

  // 3. Cálculos para gráfico de Compras por Materia Prima (Costo Acumulado y Volumen)
  const topSpentIngredientsData = useMemo(() => {
    const costMap: Record<string, { name: string; totalSpent: number; unit: string; totalQty: number }> = {};
    purchaseOrders.forEach(po => {
      po.items.forEach(item => {
        if (!costMap[item.ingredientName]) {
          costMap[item.ingredientName] = { name: item.ingredientName, totalSpent: 0, unit: item.unit, totalQty: 0 };
        }
        costMap[item.ingredientName].totalSpent += item.subtotal;
        costMap[item.ingredientName].totalQty += item.orderedQuantity;
      });
    });
    return Object.values(costMap).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 6);
  }, [purchaseOrders]);

  // 4. Datos para el rendimiento de proveedores
  const supplierPerformanceData = useMemo(() => {
    return suppliers.map(s => ({
      name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
      fulfillmentRate: s.fulfillmentRate || 90,
      leadTime: s.avgLeadTimeDays || 3
    }));
  }, [suppliers]);

  const activeOrdersCount = useMemo(() => 
    purchaseOrders.filter(p => p.status === 'Enviada' || p.status === 'Recepción Parcial').length
  , [purchaseOrders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner de Saludo y Resumen Ejecutivo */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                Resumen Operativo
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Control de Abastecimiento & Trazabilidad
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Monitoreo en tiempo real de niveles de stock de seguridad, órdenes de compra en tránsito y reclamos de materias primas faltantes.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('purchase-orders')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>+ Nueva Orden de Compra</span>
            </button>
          </div>
        </div>
      </div>

      <DashboardStats 
        totalIngredients={ingredients.length}
        lowStockCount={lowStockItems.length}
        activeOrdersCount={activeOrdersCount}
        activeBackordersCount={activeBackorders.length}
      />

      <DashboardCharts 
        topSpentIngredientsData={topSpentIngredientsData}
        supplierPerformanceData={supplierPerformanceData}
      />

      {/* Paneles de Control Prioritario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CriticalStockTable 
          lowStockItems={lowStockItems}
          onNavigateTab={onNavigateTab}
          onCreatePOWithIngredient={onCreatePOWithIngredient}
        />
        <PendingBackordersTable 
          activeBackorders={activeBackorders}
          onNavigateTab={onNavigateTab}
        />
      </div>

    </div>
  );
});

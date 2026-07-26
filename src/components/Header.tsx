/**
 * @file src/components/Header.tsx
 * @description Barra de navegación superior con perfiles de Google Sign-In, indicadores de alerta y cambio de pestañas del sistema.
 */

import React from 'react';
import { 
  Cake, 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  PackageCheck, 
  SearchCode, 
  Clock, 
  LogIn, 
  LogOut, 
  Database,
  AlertTriangle,
  Beaker
} from 'lucide-react';
import { UserProfile, Ingredient, Backorder } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  ingredients: Ingredient[];
  backorders: Backorder[];
  onSeedData: () => void;
  isSeeding: boolean;
}

/**
 * Componente del encabezado con navegación principal y estado de usuario.
 */
export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  ingredients,
  backorders,
  onSeedData,
  isSeeding
}) => {
  // Contar productos bajo nivel de stock de seguridad
  const lowStockCount = ingredients.filter(i => i.currentStock <= i.minStock).length;
  // Contar backorders pendientes de reclamo o entrega
  const pendingBackordersCount = backorders.filter(b => b.status === 'Pendiente Reclamo' || b.status === 'Reclamado').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Insights', icon: LayoutDashboard },
    { id: 'suppliers', label: 'Proveedores e Insumos', icon: Users },
    { id: 'purchase-orders', label: 'Órdenes de Compra', icon: ShoppingCart },
    { 
      id: 'receiving', 
      label: 'Recepción e Ingreso', 
      icon: PackageCheck 
    },
    { id: 'traceability', label: 'Trazabilidad y Lotes', icon: SearchCode },
    { 
      id: 'backorders', 
      label: 'Backorders Pendientes', 
      icon: Clock,
      badge: pendingBackordersCount > 0 ? pendingBackordersCount : undefined
    },
    { id: 'simulation', label: 'Simulador (Pruebas)', icon: Beaker }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Top Bar: Brand & User Profile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        
        {/* Logo & Application Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Cake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Cakesoft ERP
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-900">
                Gestión & Trazabilidad
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Control de Compras, Trazabilidad de Lotes e Inventario de Producción
            </p>
          </div>
        </div>

        {/* Action Controls & User Auth */}
        <div className="flex items-center gap-3">
          
          {/* Seed Data Button */}
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/60 dark:border-slate-700 transition-colors"
            title="Cargar datos iniciales de prueba en la base de datos"
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            {isSeeding ? 'Cargando Demo...' : 'Cargar Datos Demo'}
          </button>

          {/* Low Stock Quick Alert Indicator */}
          {lowStockCount > 0 && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors"
              title={`${lowStockCount} materias primas bajo nivel de stock mínimo`}
            >
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>{lowStockCount} Alertas Stock</span>
            </button>
          )}

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Usuario'} 
                  className="w-8 h-8 rounded-full border border-indigo-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                  {(user.displayName || 'U').charAt(0)}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                  {user.displayName}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {user.email || 'Operario Autenticado'}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar con Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Navigation Tabs */}
      <div className="bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-bold shadow-xs border border-indigo-200/60 dark:border-indigo-800/60'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

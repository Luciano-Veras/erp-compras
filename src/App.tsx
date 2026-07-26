/**
 * @file src/App.tsx
 * @description Componente principal de la aplicación.
 */

import React, { useState, useEffect } from 'react';
import { Supplier, Ingredient, PurchaseOrder, Lot, Backorder, UserProfile } from './types';
import { subscribeSuppliers, subscribeIngredients, subscribePurchaseOrders, subscribeLots, subscribeBackorders, seedInitialDemoData } from './services/dbService';
import { loginWithGoogle, logoutUser, subscribeAuthState } from './services/authService';
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [backorders, setBackorders] = useState<Backorder[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [preselectedIngredientForPO, setPreselectedIngredientForPO] = useState<Ingredient | null>(null);

  useEffect(() => {
    return subscribeAuthState(setCurrentUser);
  }, []);

  useEffect(() => {
    const unsubSuppliers = subscribeSuppliers(setSuppliers);
    const unsubIngredients = subscribeIngredients(setIngredients);
    const unsubPOs = subscribePurchaseOrders(setPurchaseOrders);
    const unsubLots = subscribeLots(setLots);
    const unsubBackorders = subscribeBackorders(setBackorders);

    return () => {
      unsubSuppliers();
      unsubIngredients();
      unsubPOs();
      unsubLots();
      unsubBackorders();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (suppliers.length === 0 && ingredients.length === 0) handleSeedDemoData();
    }, 1500);
    return () => clearTimeout(timer);
  }, [suppliers.length, ingredients.length]);

  const handleLogin = async () => {
    try { await loginWithGoogle(); }
    catch (err: any) { alert(err.message || 'Error al iniciar sesión'); }
  };

  const handleLogout = async () => {
    try { await logoutUser(); }
    catch (err: any) { alert(err.message || 'Error al cerrar sesión'); }
  };

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try { await seedInitialDemoData(); }
    catch (err) { console.error('Error al cargar datos:', err); }
    finally { setIsSeeding(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        ingredients={ingredients}
        backorders={backorders}
        onSeedData={handleSeedDemoData}
        isSeeding={isSeeding}
      />
      
      <MainContent 
        activeTab={activeTab}
        ingredients={ingredients}
        purchaseOrders={purchaseOrders}
        backorders={backorders}
        suppliers={suppliers}
        lots={lots}
        currentUser={currentUser}
        preselectedIngredientForPO={preselectedIngredientForPO}
        setActiveTab={setActiveTab}
        setPreselectedIngredientForPO={setPreselectedIngredientForPO}
      />

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 PyME Pastelería Industrial — Sistema de Compras, Trazabilidad e Inventario NoSQL</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Base de Datos Firestore Conectada</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

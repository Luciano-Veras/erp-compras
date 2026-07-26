import React from 'react';
import { 
  Supplier, 
  Ingredient, 
  PurchaseOrder, 
  Lot, 
  Backorder, 
  UserProfile 
} from '../types';

import { DashboardView } from './Dashboard/DashboardView';
import { SuppliersView } from './Suppliers/SuppliersView';
import { PurchaseOrdersView } from './PurchaseOrders/PurchaseOrdersView';
import { ReceivingView } from './Receiving/ReceivingView';
import { TraceabilityView } from './Traceability/TraceabilityView';
import { BackordersView } from './Backorders/BackordersView';
import { TestSimulationPanel } from './TestSimulation/TestSimulationPanel';

interface MainContentProps {
  activeTab: string;
  ingredients: Ingredient[];
  purchaseOrders: PurchaseOrder[];
  backorders: Backorder[];
  suppliers: Supplier[];
  lots: Lot[];
  currentUser: UserProfile | null;
  preselectedIngredientForPO: Ingredient | null;
  setActiveTab: (tab: string) => void;
  setPreselectedIngredientForPO: (ing: Ingredient | null) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  activeTab,
  ingredients,
  purchaseOrders,
  backorders,
  suppliers,
  lots,
  currentUser,
  preselectedIngredientForPO,
  setActiveTab,
  setPreselectedIngredientForPO
}) => {
  const handleCreatePOWithIngredient = (ingredient: Ingredient) => {
    setPreselectedIngredientForPO(ingredient);
    setActiveTab('purchase-orders');
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {activeTab === 'dashboard' && (
        <DashboardView
          ingredients={ingredients}
          purchaseOrders={purchaseOrders}
          backorders={backorders}
          suppliers={suppliers}
          onNavigateTab={setActiveTab}
          onCreatePOWithIngredient={handleCreatePOWithIngredient}
        />
      )}

      {activeTab === 'suppliers' && (
        <SuppliersView
          suppliers={suppliers}
          ingredients={ingredients}
        />
      )}

      {activeTab === 'purchase-orders' && (
        <PurchaseOrdersView
          suppliers={suppliers}
          ingredients={ingredients}
          purchaseOrders={purchaseOrders}
          currentUser={currentUser}
          preselectedIngredient={preselectedIngredientForPO}
        />
      )}

      {activeTab === 'receiving' && (
        <ReceivingView
          purchaseOrders={purchaseOrders}
          currentUser={currentUser}
        />
      )}

      {activeTab === 'traceability' && (
        <TraceabilityView
          lots={lots}
          currentUser={currentUser}
        />
      )}

      {activeTab === 'backorders' && (
        <BackordersView
          backorders={backorders}
        />
      )}

      {activeTab === 'simulation' && (
        <TestSimulationPanel 
          currentUser={currentUser}
          ingredients={ingredients}
        />
      )}
    </main>
  );
};

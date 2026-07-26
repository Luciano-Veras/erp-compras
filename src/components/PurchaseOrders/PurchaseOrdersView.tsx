import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Supplier, Ingredient, PurchaseOrder, UserProfile } from '../../types';
import { deletePurchaseOrder } from '../../services/dbService';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { PurchaseOrderList } from './PurchaseOrderList';
import { EmailDraftModal } from './EmailDraftModal';

interface PurchaseOrdersViewProps {
  suppliers: Supplier[];
  ingredients: Ingredient[];
  purchaseOrders: PurchaseOrder[];
  currentUser: UserProfile | null;
  preselectedIngredient?: Ingredient | null;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  suppliers,
  ingredients,
  purchaseOrders,
  currentUser,
  preselectedIngredient
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPOForEmail, setSelectedPOForEmail] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    if (preselectedIngredient) {
      setIsCreating(true);
    }
  }, [preselectedIngredient]);

  const handleDeletePO = async (poId: string) => {
    if (confirm(`¿Está seguro de que desea eliminar la Orden de Compra ${poId}? Esta acción es irreversible.`)) {
      try {
        await deletePurchaseOrder(poId);
      } catch (err) {
        console.error('Error al eliminar:', err);
      }
    }
  };

  const handleSuccessForm = (newPO: PurchaseOrder) => {
    setIsCreating(false);
    setSelectedPOForEmail(newPO);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
            Órdenes de Compra (OC)
          </h2>
          <p className="text-xs text-slate-500 mt-1">Elaboración de pedidos a proveedores, cálculo de costos y generación de emails formales</p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> <span>+ Elaborar Nueva Orden de Compra</span>
          </button>
        )}
      </div>

      {isCreating && (
        <PurchaseOrderForm
          suppliers={suppliers}
          ingredients={ingredients}
          currentUser={currentUser}
          preselectedIngredient={preselectedIngredient}
          onCancel={() => setIsCreating(false)}
          onSuccess={handleSuccessForm}
        />
      )}

      <PurchaseOrderList
        purchaseOrders={purchaseOrders}
        onSelectEmailPO={setSelectedPOForEmail}
        onDeletePO={handleDeletePO}
      />

      <EmailDraftModal
        selectedPOForEmail={selectedPOForEmail}
        onClose={() => setSelectedPOForEmail(null)}
      />
    </div>
  );
};

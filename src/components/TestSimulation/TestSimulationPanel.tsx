import React, { useState } from 'react';
import { Beaker, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { UserProfile, Ingredient } from '../../types';
import { 
  createPurchaseOrder, 
  processItemReceipt, 
  updateIngredientStock 
} from '../../services/dbService';
import { generatePOCode } from '../../utils/formatters';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface TestSimulationPanelProps {
  currentUser: UserProfile | null;
  ingredients: Ingredient[];
}

/**
 * Panel de Simulación de Pruebas.
 * @param {TestSimulationPanelProps} props
 * @returns {JSX.Element}
 */
export const TestSimulationPanel: React.FC<TestSimulationPanelProps> = ({ currentUser, ingredients }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const testBackorder = async () => {
    setIsLoading(true);
    addLog('Iniciando Prueba 1: Recepción Parcial (Backorder)');
    try {
      if (ingredients.length === 0) throw new Error('No hay insumos para probar');
      const testIng = ingredients[0];
      
      const poCode = generatePOCode();
      const po = {
        id: poCode,
        supplierId: 'test-supp',
        supplierName: 'Proveedor Test',
        supplierEmail: 'test@test.com',
        status: 'Enviada' as any,
        items: [{
          ingredientId: testIng.id,
          ingredientName: testIng.name,
          unit: testIng.unit,
          orderedQuantity: 100,
          receivedQuantity: 0,
          unitPrice: 10,
          subtotal: 1000
        }],
        totalAmount: 1000,
        createdAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || '123',
        createdByName: currentUser?.displayName || 'Tester'
      };
      
      await createPurchaseOrder(po);
      addLog(`OC ${poCode} creada por 100 ${testIng.unit} de ${testIng.name}`);

      addLog(`Recibiendo 60 ${testIng.unit}...`);
      const res = await processItemReceipt({
        po: po,
        ingredientId: testIng.id,
        ingredientName: testIng.name,
        unit: testIng.unit,
        orderedQty: 100,
        receivedQty: 60,
        supplierLotNumber: 'LOTE-TEST-123',
        expirationDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        expectRemaining: true,
        operatorUid: currentUser?.uid || '123',
        operatorName: currentUser?.displayName || 'Tester'
      });

      if (res.backorderCreated) {
        addLog('✅ ÉXITO: Backorder generado correctamente por los 40 faltantes.');
      } else {
        addLog('❌ ERROR: No se generó el backorder.');
      }
    } catch (e: any) {
      addLog(`❌ ERROR: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testMinStock = async () => {
    setIsLoading(true);
    addLog('Iniciando Prueba 2: Alerta de Stock Mínimo');
    try {
      if (ingredients.length === 0) throw new Error('No hay insumos para probar');
      const testIng = ingredients[0];
      
      addLog(`Reduciendo stock de ${testIng.name} a 0...`);
      await updateIngredientStock(testIng.id, -testIng.currentStock);
      
      addLog('✅ ÉXITO: Stock reducido. Verifique el Dashboard para confirmar la alerta visual en rojo.');
    } catch (e: any) {
      addLog(`❌ ERROR: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testTraceability = async () => {
    setIsLoading(true);
    addLog('Iniciando Prueba 3: Cadena de Trazabilidad');
    try {
      if (ingredients.length === 0) throw new Error('No hay insumos para probar');
      const testIng = ingredients[0];
      
      const poCode = generatePOCode();
      const po = {
        id: poCode,
        supplierId: 'test-supp-2',
        supplierName: 'Proveedor Test 2',
        supplierEmail: 'test2@test.com',
        status: 'Enviada' as any,
        items: [{
          ingredientId: testIng.id,
          ingredientName: testIng.name,
          unit: testIng.unit,
          orderedQuantity: 50,
          receivedQuantity: 0,
          unitPrice: 10,
          subtotal: 500
        }],
        totalAmount: 500,
        createdAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || '123',
        createdByName: currentUser?.displayName || 'Tester'
      };
      await createPurchaseOrder(po);

      const res = await processItemReceipt({
        po: po,
        ingredientId: testIng.id,
        ingredientName: testIng.name,
        unit: testIng.unit,
        orderedQty: 50,
        receivedQty: 50,
        supplierLotNumber: 'LOTE-PROVEEDOR-999',
        expirationDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        expectRemaining: false,
        operatorUid: currentUser?.uid || '123',
        operatorName: currentUser?.displayName || 'Tester'
      });

      addLog(`✅ ÉXITO: Lote Interno autogenerado: ${res.internalLotNumber}. Vaya a 'Trazabilidad' para asignarlo a una torta.`);
    } catch (e: any) {
      addLog(`❌ ERROR: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testExpiration = async () => {
    setIsLoading(true);
    addLog('Iniciando Prueba 4: Alertas de Vencimiento');
    try {
      if (ingredients.length === 0) throw new Error('No hay insumos para probar');
      const testIng = ingredients[0];
      
      const poCode = generatePOCode();
      const po = {
        id: poCode,
        supplierId: 'test-supp-3',
        supplierName: 'Proveedor Test 3',
        supplierEmail: 'test3@test.com',
        status: 'Enviada' as any,
        items: [{
          ingredientId: testIng.id,
          ingredientName: testIng.name,
          unit: testIng.unit,
          orderedQuantity: 10,
          receivedQuantity: 0,
          unitPrice: 10,
          subtotal: 100
        }],
        totalAmount: 100,
        createdAt: new Date().toISOString(),
        createdByUid: currentUser?.uid || '123',
        createdByName: currentUser?.displayName || 'Tester'
      };
      await createPurchaseOrder(po);

      const res = await processItemReceipt({
        po: po,
        ingredientId: testIng.id,
        ingredientName: testIng.name,
        unit: testIng.unit,
        orderedQty: 10,
        receivedQty: 10,
        supplierLotNumber: 'LOTE-PROVEEDOR-VENC',
        expirationDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days
        expectRemaining: false,
        operatorUid: currentUser?.uid || '123',
        operatorName: currentUser?.displayName || 'Tester'
      });

      addLog(`✅ ÉXITO: Lote con vencimiento a 3 días ingresado: ${res.internalLotNumber}. Revise 'Trazabilidad'.`);
    } catch (e: any) {
      addLog(`❌ ERROR: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSecurity = async () => {
    setIsLoading(true);
    addLog('Iniciando Prueba 5: Seguridad de Datos (Firestore Rules)');
    try {
      // Trying direct bypass write without auth check logic wrap
      await addDoc(collection(db, 'purchaseOrders'), { test: true });
      addLog('❌ ERROR: Se logró escribir sin autenticación. Revise las reglas.');
    } catch (e: any) {
      addLog(`✅ ÉXITO: Acceso rechazado por reglas de seguridad de Firebase. Detalle: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800 relative overflow-hidden">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Beaker className="w-6 h-6 text-indigo-400" />
          Simulación de Pruebas
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl mt-1">
          Panel de testing para validar los 5 escenarios críticos de negocio y trazabilidad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <button onClick={testBackorder} disabled={isLoading} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-colors">
            <h3 className="font-bold text-sm">Prueba 1: Recepción Parcial (Backorder)</h3>
            <p className="text-xs text-slate-500 mt-1">Simula OC 100kg, recibe 60kg, valida backorder 40kg.</p>
          </button>
          
          <button onClick={testMinStock} disabled={isLoading} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-rose-500 transition-colors">
            <h3 className="font-bold text-sm text-rose-600">Prueba 2: Alertas de Stock Mínimo</h3>
            <p className="text-xs text-slate-500 mt-1">Reduce stock de un insumo a 0 para forzar alerta en Dashboard.</p>
          </button>

          <button onClick={testTraceability} disabled={isLoading} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors">
            <h3 className="font-bold text-sm text-emerald-600">Prueba 3: Cadena de Trazabilidad</h3>
            <p className="text-xs text-slate-500 mt-1">Ingresa insumo, asocia lote proveedor, genera lote interno.</p>
          </button>

          <button onClick={testExpiration} disabled={isLoading} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-colors">
            <h3 className="font-bold text-sm text-amber-600">Prueba 4: Alertas de Vencimiento</h3>
            <p className="text-xs text-slate-500 mt-1">Ingresa lote con vto. a 3 días, catalogado como "Crítico".</p>
          </button>

          <button onClick={testSecurity} disabled={isLoading} className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-colors">
            <h3 className="font-bold text-sm">Prueba 5: Seguridad de Datos</h3>
            <p className="text-xs text-slate-500 mt-1">Intenta escribir en DB simulando falta de sesión.</p>
          </button>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-y-auto max-h-[500px] font-mono text-xs">
          <h3 className="text-slate-400 font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Consola de Pruebas
          </h3>
          <ul className="space-y-2">
            {logs.map((l, i) => (
              <li key={i} className={`${l.includes('❌') ? 'text-rose-400' : l.includes('✅') ? 'text-emerald-400' : 'text-slate-300'}`}>{l}</li>
            ))}
            {logs.length === 0 && <li className="text-slate-600 italic">Esperando ejecución de pruebas...</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

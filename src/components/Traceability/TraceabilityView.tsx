/**
 * @file src/components/Traceability/TraceabilityView.tsx
 * @description Motor de Búsqueda y Auditoría de Trazabilidad de Lotes de Insumos y Asignación a Producción de Tortas.
 */

import React, { useState } from 'react';
import { 
  SearchCode, 
  Calendar, 
  User, 
  Layers, 
  Cake, 
  AlertTriangle, 
  Plus, 
  CheckCircle, 
  Search,
  Hash,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Lot, UserProfile } from '../../types';
import { assignLotToCakeProduction } from '../../services/dbService';
import { 
  formatDate, 
  getDaysUntilExpiration, 
  getExpirationStatus, 
  generateProductionBatchCode 
} from '../../utils/formatters';
import { Modal } from '../Common/Modal';
import { Badge } from '../Common/Badge';

interface TraceabilityViewProps {
  lots: Lot[];
  currentUser: UserProfile | null;
}

/**
 * Componente de trazabilidad y asignación a lotes de producción de tortas.
 */
export const TraceabilityView: React.FC<TraceabilityViewProps> = ({ lots, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'available'>('all');

  // Asignación de lote a tirada de producción de tortas
  const [selectedLotForProduction, setSelectedLotForProduction] = useState<Lot | null>(null);
  const [cakeType, setCakeType] = useState('Torta Rogel Industrial');
  const [quantityToUse, setQuantityToUse] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrado de búsquedas
  const filteredLots = lots.filter(lot => {
    const matchesSearch = 
      lot.internalLotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.supplierLotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.ingredientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.receivedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.assignedProductionBatches?.some(b => b.productionBatchId.toLowerCase().includes(searchTerm.toLowerCase()) || b.cakeType.toLowerCase().includes(searchTerm.toLowerCase()));

    const daysLeft = getDaysUntilExpiration(lot.expirationDate);
    
    if (statusFilter === 'critical') return matchesSearch && daysLeft <= 15;
    if (statusFilter === 'available') return matchesSearch && lot.quantityRemaining > 0;
    return matchesSearch;
  });

  // Procesar asignación a producción de torta
  const handleAssignProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotForProduction || quantityToUse <= 0) return;

    if (quantityToUse > selectedLotForProduction.quantityRemaining) {
      alert(`La cantidad a consumir (${quantityToUse}) supera el remanente del lote (${selectedLotForProduction.quantityRemaining} ${selectedLotForProduction.unit}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const prodCode = generateProductionBatchCode(cakeType);
      await assignLotToCakeProduction(
        selectedLotForProduction.id,
        selectedLotForProduction.ingredientId,
        prodCode,
        cakeType,
        quantityToUse,
        currentUser?.displayName || 'Pastelero'
      );

      setSelectedLotForProduction(null);
    } catch (err) {
      console.error('Error al asignar el lote a la producción:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Encabezado y Motor de Búsqueda */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SearchCode className="w-6 h-6 text-indigo-600" />
            Auditoría de Trazabilidad de Lotes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Historial de lotes recibidos, alertas de vencimiento y asignación a lotes de producción de tortas
          </p>
        </div>

        {/* Buscador & Filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar Lote Interno, Proveedor, Torta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
            >
              Todos ({lots.length})
            </button>
            <button
              onClick={() => setStatusFilter('critical')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'critical' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-500'}`}
            >
              Próx. a Vencer
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'available' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'}`}
            >
              Con Stock
            </button>
          </div>
        </div>
      </div>

      {/* TARJETAS Y TABLA DE AUDITORÍA DE LOTES */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLots.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No se encontraron lotes que coincidan con la búsqueda.
          </div>
        ) : (
          filteredLots.map((lot) => {
            const expStatus = getExpirationStatus(lot.expirationDate);
            const daysLeft = getDaysUntilExpiration(lot.expirationDate);

            const badgeVariant = 
              expStatus === 'expired' ? 'danger' :
              expStatus === 'critical' ? 'danger' :
              expStatus === 'warning' ? 'warning' : 'success';

            const expLabel = 
              expStatus === 'expired' ? `¡VENCIDO hace ${Math.abs(daysLeft)} días!` :
              expStatus === 'critical' ? `¡Vence en ${daysLeft} días!` :
              expStatus === 'warning' ? `Vence en ${daysLeft} días` : `Vence el ${formatDate(lot.expirationDate)}`;

            return (
              <div key={lot.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                
                {/* Header de la Tarjeta del Lote */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                        {lot.internalLotNumber}
                      </span>
                      <Badge variant={badgeVariant}>
                        {expLabel}
                      </Badge>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        Lote Proveedor: {lot.supplierLotNumber}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {lot.ingredientName} (OC: {lot.purchaseOrderId})
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Remanente de Lote</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {lot.quantityRemaining} / {lot.quantityReceived} {lot.unit}
                      </p>
                    </div>

                    {lot.quantityRemaining > 0 && (
                      <button
                        onClick={() => {
                          setSelectedLotForProduction(lot);
                          setQuantityToUse(Math.min(20, lot.quantityRemaining));
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        <Cake className="w-4 h-4" />
                        <span>Asignar a Torta</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Info de Auditoría y Operario */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fecha Recepción: <strong>{formatDate(lot.receivedAt)}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Recepcionado por: <strong>{lot.receivedByName}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Vencimiento: <strong>{formatDate(lot.expirationDate)}</strong></span>
                  </div>
                </div>

                {/* Historial de Lotes de Producción de Tortas en los que fue asignado */}
                {lot.assignedProductionBatches && lot.assignedProductionBatches.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Cake className="w-3.5 h-3.5 text-amber-500" />
                      Trazabilidad en Lotes de Producción de Tortas:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {lot.assignedProductionBatches.map((asg) => (
                        <div key={asg.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                          <p className="font-bold text-amber-700 dark:text-amber-300 font-mono text-[11px]">
                            {asg.productionBatchId}
                          </p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{asg.cakeType}</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>Consumido: {asg.quantityUsed} {lot.unit}</span>
                            <span>{formatDate(asg.assignedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE ASIGNACIÓN A LOTE DE PRODUCCIÓN DE TORTAS */}
      <Modal
        isOpen={!!selectedLotForProduction}
        onClose={() => setSelectedLotForProduction(null)}
        title="Asignar Lote a Producción de Tortas"
        subtitle={`Consumir insumo del lote ${selectedLotForProduction?.internalLotNumber}`}
      >
        {selectedLotForProduction && (
          <form onSubmit={handleAssignProduction} className="space-y-4">
            
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">Materia Prima: {selectedLotForProduction.ingredientName}</p>
              <p className="text-slate-600 dark:text-slate-300">
                Remanente Disponible en este Lote: <strong className="text-amber-700 dark:text-amber-400">{selectedLotForProduction.quantityRemaining} {selectedLotForProduction.unit}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Receta / Tipo de Torta a Producir *
              </label>
              <select
                value={cakeType}
                onChange={(e) => setCakeType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="Torta Rogel Industrial (50 unidades)">Torta Rogel Industrial (50 unidades)</option>
                <option value="Torta Selva Negra con Marrasquino (30 unidades)">Torta Selva Negra con Marrasquino (30 unidades)</option>
                <option value="Torta Mousse de Chocolate 60% (40 unidades)">Torta Mousse de Chocolate 60% (40 unidades)</option>
                <option value="Torta de Manzana y Canela (60 unidades)">Torta de Manzana y Canela (60 unidades)</option>
                <option value="Torta Balcarce con Merengue (25 unidades)">Torta Balcarce con Merengue (25 unidades)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cantidad a Consumir del Lote ({selectedLotForProduction.unit}) *
              </label>
              <input
                type="number"
                min={1}
                max={selectedLotForProduction.quantityRemaining}
                required
                value={quantityToUse}
                onChange={(e) => setQuantityToUse(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedLotForProduction(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
              >
                {isSubmitting ? 'Guardando...' : 'Registrar Lote de Producción'}
              </button>
            </div>

          </form>
        )}
      </Modal>

    </div>
  );
};

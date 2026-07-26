/**
 * @file src/components/Backorders/BackordersView.tsx
 * @description Módulo para gestión de Backorders (pedidos pendientes por entregar) y redactor automático de cartas de reclamo a proveedores.
 */

import React, { useState } from 'react';
import { 
  Clock, 
  Mail, 
  Check, 
  Copy, 
  AlertCircle, 
  Building, 
  CheckCircle2, 
  XCircle,
  FileText
} from 'lucide-react';
import { Backorder } from '../../types';
import { updateBackorderStatus } from '../../services/dbService';
import { formatDate, generateClaimEmailDraft } from '../../utils/formatters';
import { Modal } from '../Common/Modal';
import { Badge } from '../Common/Badge';

interface BackordersViewProps {
  backorders: Backorder[];
}

/**
 * Componente para administración de reclamos de backorders pendientes.
 */
export const BackordersView: React.FC<BackordersViewProps> = ({ backorders }) => {
  const [selectedBackorderForClaim, setSelectedBackorderForClaim] = useState<Backorder | null>(null);
  const [copiedClaimText, setCopiedClaimText] = useState(false);

  // Copiar el correo de reclamo redactado
  const handleCopyClaim = (bo: Backorder) => {
    const text = generateClaimEmailDraft(bo);
    navigator.clipboard.writeText(text);
    setCopiedClaimText(true);
    setTimeout(() => setCopiedClaimText(false), 2500);

    // Marcar automáticamente como 'Reclamado' si estaba pendiente
    if (bo.status === 'Pendiente Reclamo') {
      updateBackorderStatus(bo.id, 'Reclamado', 'Reclamo enviado por email.');
    }
  };

  // Cambiar estado del backorder
  const handleStatusChange = async (boId: string, newStatus: any) => {
    await updateBackorderStatus(boId, newStatus);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Encabezado Principal */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            Gestión de Backorders y Reclamos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Seguimiento de entregas incompletas y redacción de reclamos para proveedores
          </p>
        </div>

        <Badge variant="warning">
          {backorders.filter(b => b.status === 'Pendiente Reclamo' || b.status === 'Reclamado').length} Reclamos Activos
        </Badge>
      </div>

      {/* TABLA DE BACKORDERS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Orden de Compra</th>
                <th className="p-4">Proveedor</th>
                <th className="p-4">Materia Prima Faltante</th>
                <th className="p-4">Solicitado vs Recibido</th>
                <th className="p-4">CANTIDAD PENDIENTE</th>
                <th className="p-4">Estado Reclamo</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {backorders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No hay ningún registro de backorder o entregas faltantes.
                  </td>
                </tr>
              ) : (
                backorders.map((bo) => {
                  const badgeVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
                    'Pendiente Reclamo': 'danger',
                    'Reclamado': 'warning',
                    'Entregado': 'success',
                    'Cancelado': 'neutral'
                  };

                  return (
                    <tr key={bo.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-black text-amber-600 font-mono">{bo.purchaseOrderId}</td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{bo.supplierName}</td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{bo.ingredientName}</td>

                      <td className="p-4 text-slate-500">
                        {bo.orderedQuantity} {bo.unit} (Recibido: {bo.receivedQuantity} {bo.unit})
                      </td>

                      <td className="p-4 font-black text-rose-600 dark:text-rose-400 text-sm">
                        {bo.pendingQuantity} {bo.unit}
                      </td>

                      <td className="p-4">
                        <select
                          value={bo.status}
                          onChange={(e) => handleStatusChange(bo.id, e.target.value)}
                          className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                        >
                          <option value="Pendiente Reclamo">Pendiente Reclamo</option>
                          <option value="Reclamado">Reclamado al Proveedor</option>
                          <option value="Entregado">Entregado (Resuelto)</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedBackorderForClaim(bo)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm inline-flex items-center gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Redactar Reclamo</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE REDACCIÓN FORMAL DE RECLAMO PARA PROVEEDOR */}
      <Modal
        isOpen={!!selectedBackorderForClaim}
        onClose={() => setSelectedBackorderForClaim(null)}
        title="Redacción de Reclamo de Faltante (Backorder)"
        subtitle={`Para enviar a ${selectedBackorderForClaim?.supplierName}`}
        maxWidth="2xl"
      >
        {selectedBackorderForClaim && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300">
              Copie este texto redactado de reclamo para enviárselo al proveedor notificándole el saldo faltante de <strong>{selectedBackorderForClaim.pendingQuantity} {selectedBackorderForClaim.unit}</strong> de {selectedBackorderForClaim.ingredientName}.
            </div>

            <textarea
              readOnly
              rows={12}
              value={generateClaimEmailDraft(selectedBackorderForClaim)}
              className="w-full p-4 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-amber-200 focus:outline-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Fecha de Recepción Inicial: {formatDate(selectedBackorderForClaim.createdAt)}
              </span>

              <button
                onClick={() => handleCopyClaim(selectedBackorderForClaim)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center gap-2"
              >
                {copiedClaimText ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    <span>¡Reclamo Copiado & Marcado Reclamado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Carta de Reclamo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

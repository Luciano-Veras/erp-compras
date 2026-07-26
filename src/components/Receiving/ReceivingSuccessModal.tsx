import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '../Common/Modal';

interface ReceivingSuccessModalProps {
  successReceiptInfo: { internalLotNumber: string; backorderCreated: boolean } | null;
  onClose: () => void;
}

/**
 * Modal para mostrar el éxito de una recepción física y el lote generado.
 * @param {ReceivingSuccessModalProps} props
 * @returns {JSX.Element}
 */
export const ReceivingSuccessModal: React.FC<ReceivingSuccessModalProps> = ({
  successReceiptInfo,
  onClose
}) => {
  return (
    <Modal
      isOpen={!!successReceiptInfo}
      onClose={onClose}
      title="¡Recepción Registrada con Éxito!"
      subtitle="Se ha generado la trazabilidad del insumo en el sistema"
    >
      {successReceiptInfo && (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Número de Lote Interno Generado:</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {successReceiptInfo.internalLotNumber}
            </p>
          </div>

          {successReceiptInfo.backorderCreated && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              Se creó automáticamente un registro de <strong>Backorder Pendiente</strong> para reclamar la cantidad faltante al proveedor.
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
          >
            Entendido / Continuar
          </button>
        </div>
      )}
    </Modal>
  );
};

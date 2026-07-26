import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { PurchaseOrder } from '../../types';
import { generatePOEmailDraft } from '../../utils/formatters';
import { Modal } from '../Common/Modal';

interface EmailDraftModalProps {
  selectedPOForEmail: PurchaseOrder | null;
  onClose: () => void;
}

export const EmailDraftModal: React.FC<EmailDraftModalProps> = ({
  selectedPOForEmail,
  onClose
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (po: PurchaseOrder) => {
    const draftText = generatePOEmailDraft(po);
    navigator.clipboard.writeText(draftText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <Modal
      isOpen={!!selectedPOForEmail}
      onClose={onClose}
      title={`Borrador de Correo - OC ${selectedPOForEmail?.id}`}
      subtitle={`Generado automáticamente para enviar a ${selectedPOForEmail?.supplierName}`}
      maxWidth="2xl"
    >
      {selectedPOForEmail && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            Copie este borrador redactado profesionalmente para enviárselo directamente por correo electrónico al proveedor.
          </div>
          <div className="relative">
            <textarea
              readOnly
              rows={14}
              value={generatePOEmailDraft(selectedPOForEmail)}
              className="w-full p-4 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-amber-200 focus:outline-none leading-relaxed"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Email de Destino: <strong className="text-slate-700 dark:text-slate-200">{selectedPOForEmail.supplierEmail}</strong>
            </span>
            <button
              onClick={() => handleCopyEmail(selectedPOForEmail)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center gap-2"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950" />
                  <span>¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Texto de Correo</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

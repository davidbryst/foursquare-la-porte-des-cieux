import { useState, useEffect } from 'react';
import { useModal } from '~/context/ModalContext';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '~/context/ToastContext';
import { Spinner } from '../ui/Toast';

export default function PresenceEditModal() {
  const { 
    isPresenceModalOpen, 
    selectedPresence, 
    closePresenceModal,
    onPresenceSave,
  } = useModal();

  const [editPresenceStatus, setEditPresenceStatus] = useState<'Présent' | 'Absent'>(
    selectedPresence?.presence === 'Présent' ? 'Présent' : 'Absent'
  );
  const [editCulte, setEditCulte] = useState(selectedPresence?.culte || '1er culte');
  const [editRaisonAbsence, setEditRaisonAbsence] = useState(selectedPresence?.pkabsence || '');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // Mettre à jour les états locaux quand la présence sélectionnée change
  useEffect(() => {
    if (selectedPresence) {
      setEditPresenceStatus(selectedPresence.presence === 'Présent' ? 'Présent' : 'Absent');
      setEditCulte(selectedPresence.culte || '1er culte');
      setEditRaisonAbsence(selectedPresence.pkabsence || '');
      setIsLoading(false); // Reset loading state when opening modal
    }
  }, [selectedPresence]);

  const handleSaveEdit = () => {
    if (!selectedPresence) return;

    // Vérifier la raison si absent
    if (editPresenceStatus === 'Absent' && !editRaisonAbsence.trim()) {
      showToast("Veuillez indiquer la raison de l'absence.", "error");
      return;
    }

    setIsLoading(true);

    if (onPresenceSave) {
      onPresenceSave({
        id: selectedPresence.id,
        presenceStatus: editPresenceStatus,
        culte: editCulte,
        pkabsence: editPresenceStatus === 'Absent' ? editRaisonAbsence.trim() : null,
      });
    }
    // Ne pas fermer la modale ici - le dashboard le fera après succès
  };

  if (!isPresenceModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 animate-fadeIn overflow-auto min-h-screen min-w-full" onClick={isLoading ? undefined : closePresenceModal}>
      <div className="bg-white rounded-xl p-5 w-full max-w-3xl my-8  mx-2 shadow-xl animate-slideIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-white px-5 py-4 -m-5 mb-5 rounded-t-lg ">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-[#4a2b87]">
            <FontAwesomeIcon icon={faPencil} className="w-5 h-5" />
            Modifier la présence
          </h2>
          <button
            onClick={closePresenceModal}
            disabled={isLoading}
            className="text-[#4a2b87] hover:text-[#5a3b97] text-2xl leading-none disabled:opacity-50"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">
              Membre: <span className="font-semibold text-gray-800">{selectedPresence?.nom}</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Date: <span className="font-semibold text-gray-800">{selectedPresence?.date}</span>
            </p>
          </div>

          <div>
            <label className="form-label text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
              Statut de présence
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  editPresenceStatus === 'Présent'
                    ? 'border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32]'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="editPresence"
                  value="Présent"
                  checked={editPresenceStatus === 'Présent'}
                  onChange={() => setEditPresenceStatus('Présent')}
                  disabled={isLoading}
                  className="sr-only"
                />
                <span className="font-medium">Présent</span>
              </label>
              <label
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  editPresenceStatus === 'Absent'
                    ? 'border-[#c62828] bg-[#ffebee] text-[#c62828]'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="editPresence"
                  value="Absent"
                  checked={editPresenceStatus === 'Absent'}
                  onChange={() => setEditPresenceStatus('Absent')}
                  disabled={isLoading}
                  className="sr-only"
                />
                <span className="font-medium">Absent</span>
              </label>
            </div>
          </div>

          {/* Raison d'absence - affiché uniquement si Absent est sélectionné */}
          {editPresenceStatus === 'Absent' && (
            <div className="animate-fadeIn">
              <label className="block mb-1.5 text-gray-700 font-medium text-sm">
                Raison de l'absence <span className="text-[#c62828]">*</span>
              </label>
              <textarea
                value={editRaisonAbsence}
                onChange={(e) => setEditRaisonAbsence(e.target.value)}
                placeholder="Indiquez la raison de l'absence..."
                rows={3}
                disabled={isLoading}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20 focus:outline-none resize-none disabled:opacity-50"
              />
            </div>
          )}

          <div>
            <Select
              label="Culte"
              value={editCulte}
              onChange={(e) => setEditCulte(e.target.value)}
              disabled={isLoading}
            >
              <option value="1er culte">1er culte</option>
              <option value="2ème culte">2ème culte</option>
            </Select>
          </div>

          <div className="flex gap-3 pt-3 text-sm">
            <Button onClick={handleSaveEdit} fullWidth disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="border-white/30 border-t-white" />
                  Enregistrement...
                </span>
              ) : (
                "Enregistrer"
              )}
            </Button>
            <Button onClick={closePresenceModal} variant="secondary" fullWidth disabled={isLoading} className="ring-1 ring-[#c7b8ea] text-[#4a2b87]">
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

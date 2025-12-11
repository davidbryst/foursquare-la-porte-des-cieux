import { useState, useEffect } from 'react';
import { useModal } from '~/context/ModalContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';

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

  // Mettre à jour les états locaux quand la présence sélectionnée change
  useEffect(() => {
    if (selectedPresence) {
      setEditPresenceStatus(selectedPresence.presence === 'Présent' ? 'Présent' : 'Absent');
      setEditCulte(selectedPresence.culte || '1er culte');
    }
  }, [selectedPresence]);

  const handleSaveEdit = () => {
    if (!selectedPresence) return;

    if (onPresenceSave) {
      onPresenceSave({
        id: selectedPresence.id,
        presenceStatus: editPresenceStatus,
        culte: editCulte,
      });
    }

    closePresenceModal();
  };

  if (!isPresenceModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 animate-fadeIn overflow-auto" onClick={closePresenceModal}>
      <div className="bg-white rounded-lg p-5 w-full max-w-3xl my-8 shadow-xl animate-slideIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-white px-5 py-4 -m-5 mb-5 rounded-t-lg ">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-[#4a2b87]">
            <FontAwesomeIcon icon={faPencil} className="w-5 h-5" />
            Modifier la présence
          </h2>
          <button
            onClick={closePresenceModal}
            className="text-[#4a2b87] hover:text-[#5a3b97] text-2xl leading-none"
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
                }`}
              >
                <input
                  type="radio"
                  name="editPresence"
                  value="Présent"
                  checked={editPresenceStatus === 'Présent'}
                  onChange={() => setEditPresenceStatus('Présent')}
                  className="sr-only"
                />
                <span className="font-medium">Présent</span>
              </label>
              <label
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  editPresenceStatus === 'Absent'
                    ? 'border-[#c62828] bg-[#ffebee] text-[#c62828]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="editPresence"
                  value="Absent"
                  checked={editPresenceStatus === 'Absent'}
                  onChange={() => setEditPresenceStatus('Absent')}
                  className="sr-only"
                />
                <span className="font-medium">Absent</span>
              </label>
            </div>
          </div>

          <div>
            <Select
              label="Culte"
              value={editCulte}
              onChange={(e) => setEditCulte(e.target.value)}
            >
              <option value="1er culte">1er culte</option>
              <option value="2ème culte">2ème culte</option>
            </Select>
          </div>

          <div className="flex gap-3 pt-3 text-sm">
            <Button onClick={handleSaveEdit} fullWidth>
              Enregistrer
            </Button>
            <Button onClick={closePresenceModal} variant="secondary" fullWidth>
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

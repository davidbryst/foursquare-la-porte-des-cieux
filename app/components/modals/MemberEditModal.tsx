import { useState, useEffect } from 'react';
import { useModal } from '~/context/ModalContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '~/context/ToastContext';
import { Spinner } from '../ui/Toast';

export default function MemberEditModal() {
  const { 
    isMemberModalOpen, 
    selectedMember, 
    closeMemberModal,
    onMemberSave,
  } = useModal();

  const [editNom, setEditNom] = useState(selectedMember?.nom || '');
  const [editPrenom, setEditPrenom] = useState(selectedMember?.prenom || '');
  const [editNumero, setEditNumero] = useState(selectedMember?.numero || '');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // Mettre à jour les états locaux quand le membre sélectionné change
  useEffect(() => {
    if (selectedMember) {
      setEditNom(selectedMember.nom || '');
      setEditPrenom(selectedMember.prenom || '');
      setEditNumero(selectedMember.numero || '');
      setIsLoading(false); // Reset loading state when opening modal
    }
  }, [selectedMember]);

  const handleSaveEdit = () => {
    if (!selectedMember) return;
    if (!editNom.trim() || !editPrenom.trim()) {
      showToast("Le nom et le prénom sont obligatoires.", "error");
      return;
    }

    setIsLoading(true);
    
    if (onMemberSave) {
      onMemberSave({
        id: selectedMember.id,
        nom: editNom.trim(),
        prenom: editPrenom.trim(),
        numero: editNumero.trim(),
      });
    }
    // Ne pas fermer la modale ici - le dashboard le fera après succès
  };

  if (!isMemberModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 animate-fadeIn overflow-auto min-h-screen min-w-full" onClick={isLoading ? undefined : closeMemberModal}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-3xl my-8 mx-2 shadow-xl animate-slideIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-white px-5 py-4 -m-5 mb-5 rounded-t-lg ">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-[#4a2b87]">
            <FontAwesomeIcon icon={faPencil} className="w-5 h-5" />
            Modifier le membre
          </h2>
          <button
            onClick={closeMemberModal}
            disabled={isLoading}
            className="text-[#4a2b87] hover:text-[#5a3b97] text-2xl leading-none disabled:opacity-50"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Input
            label="Nom"
            type="text"
            value={editNom}
            onChange={(e) => setEditNom(e.target.value)}
            className="mb-3"
            disabled={isLoading}
          />
          
          <Input
            label="Prénom"
            type="text"
            value={editPrenom}
            onChange={(e) => setEditPrenom(e.target.value)}
            className="mb-3"
            disabled={isLoading}
          />
          
          <Input
            label="Numéro de téléphone"
            type="text"
            value={editNumero}
            onChange={(e) => setEditNumero(e.target.value)}
            className="mb-4"
            disabled={isLoading}
          />
          
          <div className="flex gap-3 mt-6">
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
            <Button onClick={closeMemberModal} variant="secondary" fullWidth disabled={isLoading} className="ring-1 ring-[#c7b8ea] text-[#4a2b87]">
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

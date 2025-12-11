import { useState, useEffect } from 'react';
import { useModal } from '~/context/ModalContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';

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

  // Mettre à jour les états locaux quand le membre sélectionné change
  useEffect(() => {
    if (selectedMember) {
      setEditNom(selectedMember.nom || '');
      setEditPrenom(selectedMember.prenom || '');
      setEditNumero(selectedMember.numero || '');
    }
  }, [selectedMember]);

  const handleSaveEdit = () => {
    if (!selectedMember) return;
    if (!editNom.trim() || !editPrenom.trim()) {
      alert("Le nom et le prénom sont obligatoires.");
      return;
    }

    if (onMemberSave) {
      onMemberSave({
        id: selectedMember.id,
        nom: editNom.trim(),
        prenom: editPrenom.trim(),
        numero: editNumero.trim(),
      });
    }

    closeMemberModal();
  };

  if (!isMemberModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 animate-fadeIn overflow-auto" onClick={closeMemberModal}>
      <div className="bg-white rounded-lg p-5 w-full max-w-3xl my-8 shadow-xl animate-slideIn">
        <div className="flex items-center justify-between text-white px-5 py-4 -m-5 mb-5 rounded-t-lg ">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-[#4a2b87]">
            <FontAwesomeIcon icon={faPencil} className="w-5 h-5" />
            Modifier le membre
          </h2>
          <button
            onClick={closeMemberModal}
            className="text-[#4a2b87] hover:text-[#5a3b97] text-2xl leading-none"
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
          />
          
          <Input
            label="Prénom"
            type="text"
            value={editPrenom}
            onChange={(e) => setEditPrenom(e.target.value)}
            className="mb-3"
          />
          
          <Input
            label="Numéro de téléphone"
            type="text"
            value={editNumero}
            onChange={(e) => setEditNumero(e.target.value)}
            className="mb-4"
          />
          
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSaveEdit} fullWidth>
              Enregistrer
            </Button>
            <Button onClick={closeMemberModal} variant="secondary" fullWidth>
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

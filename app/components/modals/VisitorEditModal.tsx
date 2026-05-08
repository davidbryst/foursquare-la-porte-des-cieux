import { useState, useEffect } from 'react';
import { useModal } from '~/context/ModalContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '~/context/ToastContext';
import { Spinner } from '../ui/Toast';

const CATEGORIES = [
  { value: 'enfants', label: 'Enfants' },
  { value: 'jeunes', label: 'Jeunes' },
  { value: 'femmes', label: 'Femmes' },
  { value: 'hommes', label: 'Hommes' },
];

export default function VisitorEditModal() {
  const {
    isVisitorModalOpen,
    selectedVisitor,
    closeVisitorModal,
    onVisitorSave,
  } = useModal();

  const [editNom, setEditNom] = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [editTelephone, setEditTelephone] = useState('');
  const [editCulteId, setEditCulteId] = useState(1);
  const [editCategorie, setEditCategorie] = useState('hommes');
  const [editDateDeNaissance, setEditDateDeNaissance] = useState('');
  const [editResidence, setEditResidence] = useState('');
  const [editProvenance, setEditProvenance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (selectedVisitor) {
      setEditNom(selectedVisitor.nom || '');
      setEditPrenom(selectedVisitor.prenom || '');
      setEditTelephone(selectedVisitor.telephone || '');
      setEditCulteId(selectedVisitor.culteId || 1);
      setEditCategorie(selectedVisitor.categorie || 'hommes');
      setEditDateDeNaissance(selectedVisitor.dateDeNaissance || '');
      setEditResidence(selectedVisitor.residence || '');
      setEditProvenance(selectedVisitor.provenance || '');
      setIsLoading(false);
    }
  }, [selectedVisitor]);

  const handleSave = async () => {
    if (!selectedVisitor) return;
    if (!editNom.trim() || !editPrenom.trim()) {
      showToast('Le nom et le prénom sont obligatoires.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      if (onVisitorSave) {
        await onVisitorSave({
          id: selectedVisitor.id,
          nom: editNom.trim(),
          prenom: editPrenom.trim(),
          telephone: editTelephone.trim(),
          culteId: editCulteId,
          categorie: editCategorie,
          dateDeNaissance: editDateDeNaissance,
          residence: editResidence.trim(),
          provenance: editProvenance.trim(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisitorModalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 animate-fadeIn overflow-auto min-h-screen min-w-full"
      onClick={isLoading ? undefined : closeVisitorModal}
    >
      <div
        className="bg-white rounded-2xl p-5 w-full max-w-lg my-8 mx-2 shadow-xl animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-1 py-2 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-[#4a2b87]">
            <FontAwesomeIcon icon={faPencil} className="w-4 h-4" />
            Modifier le visiteur
          </h2>
          <button
            onClick={closeVisitorModal}
            disabled={isLoading}
            className="text-[#4a2b87] hover:text-[#5a3b97] text-2xl leading-none disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom" type="text" value={editNom} onChange={(e) => setEditNom(e.target.value)} disabled={isLoading} />
            <Input label="Prénom" type="text" value={editPrenom} onChange={(e) => setEditPrenom(e.target.value)} disabled={isLoading} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Téléphone" type="tel" value={editTelephone} onChange={(e) => setEditTelephone(e.target.value)} disabled={isLoading} />
            <Input label="Date de naissance" type="date" value={editDateDeNaissance} onChange={(e) => setEditDateDeNaissance(e.target.value)} disabled={isLoading} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Catégorie" value={editCategorie} onChange={(e) => setEditCategorie(e.target.value)} disabled={isLoading}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Input label="Lieu de résidence" type="text" value={editResidence} onChange={(e) => setEditResidence(e.target.value)} disabled={isLoading} />
          </div>

          <Select label="Culte" value={String(editCulteId)} onChange={(e) => setEditCulteId(parseInt(e.target.value))} disabled={isLoading}>
            <option value="1">1er culte</option>
            <option value="2">2ème culte</option>
          </Select>

          <div>
            <label className="block ml-1.5 mb-1 text-gray-700 font-bold text-sm">Provenance / Motif</label>
            <textarea
              value={editProvenance}
              onChange={(e) => setEditProvenance(e.target.value)}
              rows={2}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none resize-none disabled:opacity-50"
              placeholder="D'où vient le visiteur..."
            />
          </div>

          <div className="flex gap-3 mt-4">
            <Button onClick={handleSave} fullWidth disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="border-white/30 border-t-white" />
                  Enregistrement...
                </span>
              ) : 'Enregistrer'}
            </Button>
            <Button onClick={closeVisitorModal} variant="secondary" fullWidth disabled={isLoading} className="ring-1 ring-[#c7b8ea] text-[#4a2b87]">
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react'
import Input from './ui/Input'
import Button from './ui/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface DeleteMemberFormProps {
  onDelete: (nom: string, prenom: string, phone: string) => void
}

export default function DeleteMemberForm({ onDelete }: DeleteMemberFormProps) {
  const [showDeleteBox, setShowDeleteBox] = useState(false)
  const [delNom, setDelNom] = useState('')
  const [delPrenom, setDelPrenom] = useState('')
  const [delPhone, setDelPhone] = useState('')

  const handleDelete = () => {
    if (!delNom.trim() || !delPrenom.trim() || !delPhone.trim()) {
      alert("Nom + Prénom + Numéro EXACT requis.")
      return
    }
    onDelete(delNom.trim(), delPrenom.trim(), delPhone.trim())
    setDelNom("")
    setDelPrenom("")
    setDelPhone("")
    setShowDeleteBox(false)
  }

  return (
    <div className="text-center mt-6 pt-4 border-t border-gray-200">
      <button
        onClick={() => setShowDeleteBox(!showDeleteBox)}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-[#c62828] cursor-pointer font-medium text-sm transition-colors"
      >
        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
        <span>Supprimer une personne</span>
        <FontAwesomeIcon icon={faChevronDown} className={`w-4 h-4 transition-transform ${showDeleteBox ? 'rotate-180' : ''}`} />
      </button>

      {showDeleteBox && (
        <div className="mt-4 p-4 rounded-lg bg-[#ffebee] border border-[#ffcdd2] animate-fadeIn">
          <p className="text-[#c62828] text-sm mb-4 font-medium">
            Cette action est irréversible. Entrez les informations exactes du membre.
          </p>
          
          <div className="space-y-3">
            <Input
              placeholder="Nom EXACT"
              value={delNom}
              onChange={(e) => setDelNom(e.target.value)}
            />
            <Input
              placeholder="Prénom EXACT"
              value={delPrenom}
              onChange={(e) => setDelPrenom(e.target.value)}
            />
            <Input
              placeholder="Numéro EXACT"
              value={delPhone}
              onChange={(e) => setDelPhone(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleDelete}
              variant="danger"
              fullWidth
            >
              Supprimer définitivement
            </Button>
            <Button
              onClick={() => {
                setShowDeleteBox(false)
                setDelNom('')
                setDelPrenom('')
                setDelPhone('')
              }}
              variant="secondary"
              className="flex-shrink-0"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

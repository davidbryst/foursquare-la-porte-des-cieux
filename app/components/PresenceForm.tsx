import { useState, useEffect } from 'react'
import type { Member } from '~/db/database.server'
import SearchableSelect from './ui/SearchableSelect'
import Select from './ui/Select'
import Input from './ui/Input'
import Button from './ui/Button'
import { Check, X } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone } from '@fortawesome/free-solid-svg-icons';

interface PresenceFormProps {
  members: Member[]
  onSubmit: (memberId: number, culteId: number, isPresent: boolean, date: string, pkabsence: string | null) => void
  onSwitchToRegister?: () => void
}

export default function PresenceForm({ members, onSubmit, onSwitchToRegister }: PresenceFormProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [selectedPhone, setSelectedPhone] = useState<string>('')
  const [presence, setPresence] = useState<'Présent' | 'Absent' | ''>('')
  const [culte, setCulte] = useState('')
  const [pkabsence, setPkabsence] = useState('')

  const sortedMembers = [...members].sort((a, b) => {
    const nameA = `${a.nom} ${a.prenom}`.trim()
    const nameB = `${b.nom} ${b.prenom}`.trim()
    return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' })
  })

  // Options pour le select searchable
  const memberOptions = sortedMembers.map(member => ({
    value: member.id.toString(),
    label: `${member.nom} ${member.prenom}`
  }))

  const culteOptions = [
    { value: '1er culte', label: '1er culte' },
    { value: '2ème culte', label: '2ème culte' },
  ]

  // Mettre à jour le téléphone quand un membre est sélectionné
  useEffect(() => {
    if (selectedMemberId) {
      const member = members.find(m => m.id.toString() === selectedMemberId)
      setSelectedPhone(member?.numero || "Aucun contact enregistré")
    } else {
      setSelectedPhone("")
    }
  }, [selectedMemberId, members])

  // Réinitialiser la raison quand on change de statut
  useEffect(() => {
    if (presence === 'Présent') {
      setPkabsence('')
    }
  }, [presence])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMemberId) {
      alert("Choisis un nom.")
      return
    }
    if (!presence) {
      alert("Choisis Présent ou Absent.")
      return
    }
    if (!culte) {
      alert("Choisis le culte.")
      return
    }
    // Vérifier la raison si absent
    if (presence === 'Absent' && !pkabsence.trim()) {
      alert("Veuillez indiquer la raison de votre absence.")
      return
    }

    const memberId = parseInt(selectedMemberId)
    const culteId = culte === "1er culte" ? 1 : culte === "2ème culte" ? 2 : 1
    onSubmit(
      memberId,
      culteId,
      presence === "Présent",
      new Date().toLocaleDateString(),
      presence === 'Absent' ? pkabsence.trim() : null
    )

    setSelectedMemberId("")
    setSelectedPhone("")
    setPresence("")
    setCulte("")
    setPkabsence("")
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn">
      <h1 className="text-center text-gray-800 text-lg sm:text-xl my-1 mb-0 font-bold">
        Gestion des présences au culte
      </h1>

      <p className="text-center text-gray-700 text-sm mb-6">
        Marquez votre présence pour le culte d'aujourd'hui.
      </p>

      <div className="space-y-2">
        <SearchableSelect
          label="Sélectionnez votre nom"
          value={selectedMemberId}
          options={memberOptions}
          onChange={setSelectedMemberId}
          placeholder="Tapez pour rechercher..."
        />

        {selectedPhone && (
          <div className="bg-[#ede7f6] py-3 px-4 rounded-lg animate-fadeIn">
            <p className="flex items-center gap-2 text-[#4a2b87] text-sm">
              <FontAwesomeIcon icon={faPhone} className="w-4 h-4" />
              <span className="font-medium">{selectedPhone}</span>
            </p>
          </div>
        )}

        <div className="mt-4">
          <div>
            <label className="block ml-1.5 mb-1 text-gray-700 font-bold text-sm">Statut de présence</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center gap-2 py-2.5 px-3 bg-white rounded-lg border-2 cursor-pointer transition-all ${presence === "Présent"
                  ? 'border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32]'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <input
                  type="radio"
                  name="presence"
                  value="Présent"
                  checked={presence === "Présent"}
                  onChange={(e) => setPresence(e.target.value as 'Présent' | 'Absent')}
                  className="sr-only"
                />
                <Check size={20}   />
                <span className="font-medium text-sm">Présent</span>
              </label>
              <label
                className={`flex items-center justify-center gap-2 py-2.5 px-3 bg-white rounded-lg border-2 cursor-pointer transition-all ${presence === "Absent"
                  ? 'border-[#c62828] bg-[#ffebee] text-[#c62828]'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <input
                  type="radio"
                  name="presence"
                  value="Absent"
                  checked={presence === "Absent"}
                  onChange={(e) => setPresence(e.target.value as 'Présent' | 'Absent')}
                  className="sr-only"
                />
                <X size={20} />
                <span className="font-medium text-sm">Absent</span>
              </label>
            </div>
          </div>
        </div>

        {/* Champ raison d'absence - affiché seulement si Absent */}
        {presence === 'Absent' && (
          <div className="animate-fadeIn">
            <Input
              label="Raison de votre absence"
              type="text"
              value={pkabsence}
              onChange={(e) => setPkabsence(e.target.value)}
              placeholder="Ex: Voyage, Maladie, Travail..."
              className="border-[#c62828]/30 focus:border-[#c62828] focus:ring-[#c62828]/20"
            />
          </div>
        )}
      </div>
      <div className='mt-4'>
        
          <SearchableSelect
            label="Sélectionnez votre culte"
            value={culte}
            options={culteOptions}
            onChange={setCulte}
            placeholder="Tapez pour rechercher..."
          />
      </div>
      <div className="mt-6 space-y-3">
        <Button type="submit" fullWidth>
          Enregistrer ma présence
        </Button>

        {onSwitchToRegister && (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onSwitchToRegister}
          >
            Nouveau ? S'inscrire
          </Button>
        )}
      </div>

      <p className="mt-5 italic text-[#4a2b87] text-center text-sm bg-[#ede7f6] p-3 rounded-lg">
        "L'Éternel est mon berger : je ne manquerai de rien." — Psaume 23:1
      </p>
    </form>
  )
}

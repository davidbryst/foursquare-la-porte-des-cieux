import { useState } from 'react'
import Input from './ui/Input'
import Button from './ui/Button'

interface MemberFormProps {
  onSubmit: (nom: string, prenom: string, phone: string) => void
  onSwitchToPresence: () => void
}

export default function MemberForm({ onSubmit, onSwitchToPresence }: MemberFormProps) {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) {
      alert("Remplis le nom.")
      return
    }
    if (!prenom.trim()) {
      alert("Remplis le prénom.")
      return
    }
    if (!phone.trim()) {
      alert("Remplis le numéro de téléphone.")
      return
    }
    onSubmit(nom.trim(), prenom.trim(), phone.trim())
    setNom('')
    setPrenom('')
    setPhone('')
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn">
      <h1 className="text-center text-gray-800 text-lg sm:text-xl my-1 font-semibold">
        Enregistrement de nouveau membre
      </h1>

      <p className="text-center text-gray-700 text-sm mb-5">
        Bienvenue ! Remplissez ce formulaire pour vous inscrire.
      </p>

      <div className="space-y-4">
        <Input
          label="Nom"
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Votre nom de famille"
        />

        <Input
          label="Prénom"
          type="text"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          placeholder="Votre prénom"
        />

        <Input
          label="Numéro de téléphone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ex: 06 12 34 56 78"
        />
      </div>

      <div className="mt-10 space-y-2">
        <Button type="submit" fullWidth>
          Enregistrer
        </Button>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onSwitchToPresence}
        >
          Déjà inscrit ?
          {/* Déjà inscrit ? Aller à la présence */}
        </Button>
      </div>

      <p className="mt-5 italic text-[#4a2b87] text-center text-sm bg-[#ede7f6] p-3 rounded-lg">
        "L'Éternel est mon berger : je ne manquerai de rien." — Psaume 23:1
      </p>
    </form>
  )
}

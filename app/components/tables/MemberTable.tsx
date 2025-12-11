import { useState } from 'react'
import type { Member } from '~/db/database.server'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faUsers, faTrash } from '@fortawesome/free-solid-svg-icons';

interface MemberTableProps {
  members: Member[]
  onDelete: (memberId: number) => void
  onEdit: (memberId: number, nom: string, prenom: string, numero: string) => void
  onDownloadCSV: () => void
}

export default function MemberTable({ members, onDelete, onEdit, onDownloadCSV }: MemberTableProps) {
  const [searchMember, setSearchMember] = useState('')
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editNom, setEditNom] = useState('')
  const [editPrenom, setEditPrenom] = useState('')
  const [editNumero, setEditNumero] = useState('')

  const filteredMembers = members.filter(member => {
    const nomComplet = `${member.nom || ''} ${member.prenom || ''}`.trim().toLowerCase()
    return nomComplet.includes(searchMember.toLowerCase())
  }).sort((a, b) => {
    const nomA = `${a.nom || ''} ${a.prenom || ''}`.trim()
    const nomB = `${b.nom || ''} ${b.prenom || ''}`.trim()
    return nomA.localeCompare(nomB, 'fr', { sensitivity: 'base' })
  })

  const handleEditClick = (member: Member) => {
    setEditingMember(member)
    setEditNom(member.nom || '')
    setEditPrenom(member.prenom || '')
    setEditNumero(member.numero || '')
  }

  const handleSaveEdit = () => {
    if (!editingMember) return
    if (!editNom.trim() || !editPrenom.trim()) {
      alert("Le nom et le prénom sont obligatoires.")
      return
    }
    onEdit(editingMember.id, editNom.trim(), editPrenom.trim(), editNumero.trim())
    setEditingMember(null)
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
  }

  return (
    <div className="animate-fadeIn flex flex-col h-full min-h-0">
      {/* Barre de recherche */}
      <div className="mb-3 flex-shrink-0">
        <Input
          type="text"
          value={searchMember}
          onChange={(e) => setSearchMember(e.target.value)}
          placeholder="Rechercher un membre..."
          className="w-full"
        />
      </div>

      {/* Compteur de résultats */}
      <div className="mb-2 text-sm text-gray-600 flex-shrink-0">
        {filteredMembers.length} membre{filteredMembers.length > 1 ? 's' : ''} trouvé{filteredMembers.length > 1 ? 's' : ''}
      </div>

      {/* Modal de modification */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 animate-fadeIn overflow-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-10 shadow-xl animate-slideIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faPencil} className="w-5 h-5 text-[#4a2b87]" />
              Modifier le membre
            </h2>
            
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
              <Button onClick={handleCancelEdit} variant="secondary" fullWidth>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vue Desktop - Tableau avec scroll */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#4a2b87]">
                <th className="py-3 px-4 text-left text-white font-medium text-sm">Nom</th>
                <th className="py-3 px-4 text-left text-white font-medium text-sm">Prénom</th>
                <th className="py-3 px-4 text-left text-white font-medium text-sm">Téléphone</th>
                <th className="py-3 px-4 text-center text-white font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FontAwesomeIcon icon={faUsers} className="w-10 h-10 text-gray-300" />
                      <span className="text-sm">{searchMember ? "Aucun membre trouvé" : "Aucun membre enregistré"}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr 
                    key={member.id} 
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="py-3 px-4 text-gray-800">{member.nom || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600">{member.prenom || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-sm">{member.numero || "N/A"}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditClick(member)}
                          className="p-2 rounded-lg text-[#4a2b87] hover:bg-[#4a2b87]/10 transition-colors"
                          title="Modifier"
                        >
                          <FontAwesomeIcon icon={faPencil} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(member.id)}
                          className="p-2 rounded-lg text-[#d32f2f] hover:bg-[#d32f2f]/10 transition-colors"
                          title="Supprimer"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vue Mobile - Cartes avec scroll */}
      <div className="md:hidden flex-1 min-h-0 overflow-auto space-y-3 pr-1">
        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-gray-200">
            <FontAwesomeIcon icon={faUsers} className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <span className="text-sm">{searchMember ? "Aucun membre trouvé" : "Aucun membre enregistré"}</span>
          </div>
        ) : (
          filteredMembers.map(member => (
            <div 
              key={member.id} 
              className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-800">
                    {member.nom} {member.prenom}
                  </h3>
                  <p className="text-gray-500 font-mono text-sm mt-1">
                    {member.numero || "N/A"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditClick(member)}
                    className="p-2 rounded-lg text-[#4a2b87] hover:bg-[#4a2b87]/10 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPencil} className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(member.id)}
                    className="p-2 rounded-lg text-[#d32f2f] hover:bg-[#d32f2f]/10 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Button
        onClick={onDownloadCSV}
        fullWidth
        className="mt-4 flex-shrink-0"
      >
        Télécharger la liste des membres
      </Button>
    </div>
  )
}

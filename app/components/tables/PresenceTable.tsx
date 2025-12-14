import { useState } from 'react'
import type { Presence } from '~/db/database.server'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faTrash, faDownload, faCheckCircle, faClipboard } from '@fortawesome/free-solid-svg-icons';

interface PresenceTableProps {
  entries: Presence[]
  onDownloadCSV: () => void
  onEdit?: (presenceId: number, presence: boolean, culteId: number) => void
  onDelete?: (presenceId: number) => void
}

export default function PresenceTable({ entries, onDownloadCSV, onEdit, onDelete }: PresenceTableProps) {
  const [searchName, setSearchName] = useState('')
  const [filterCulte, setFilterCulte] = useState('')
  const [editingPresence, setEditingPresence] = useState<Presence | null>(null)
  const [editPresenceStatus, setEditPresenceStatus] = useState<'Présent' | 'Absent'>('Présent')
  const [editCulte, setEditCulte] = useState('')

  const cultes = [...new Set(entries.map(e => e.culte).filter(c => c && c !== "Non spécifié"))].sort((a, b) => {
    if (a.includes("1er")) return -1
    if (b.includes("1er")) return 1
    if (a.includes("2ème")) return -1
    if (b.includes("2ème")) return 1
    return a.localeCompare(b, 'fr')
  })

  const filteredEntries = entries.filter(e => {
    if (!e || !e.nom) return false
    const nomMatch = e.nom.toLowerCase().includes(searchName.toLowerCase())
    const culteMatch = filterCulte === "" || e.culte === filterCulte
    return nomMatch && culteMatch
  })

  const handleEditClick = (presence: Presence) => {
    setEditingPresence(presence)
    setEditPresenceStatus(presence.presence === 'Présent' ? 'Présent' : 'Absent')
    setEditCulte(presence.culte || '1er culte')
  }

  const handleSaveEdit = () => {
    if (!editingPresence || !onEdit) return
    const culteId = editCulte === "1er culte" ? 1 : editCulte === "2ème culte" ? 2 : 1
    onEdit(editingPresence.id, editPresenceStatus === 'Présent', culteId)
    setEditingPresence(null)
  }

  const handleCancelEdit = () => {
    setEditingPresence(null)
  }

  const getPresenceBadge = (presence: string, pkabsence?: string | null) => {
    if (presence === "Présent") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#e8f5e9] text-[#2e7d32]">
          Présent
        </span>
      )
    }
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#ffebee] text-[#c62828]">
          Absent
        </span>
        {pkabsence && (
          <span className="text-xs text-gray-500 italic max-w-[150px] truncate" title={pkabsence}>
            {pkabsence}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="animate-fadeIn flex flex-col h-full min-h-0">
      {/* Filtres */}
      <div className="grid grid-cols-1 gap-3 mb-3 flex-shrink-0">
        <Input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Rechercher un nom..."
        />
        <Select
          value={filterCulte}
          onChange={(e) => setFilterCulte(e.target.value)}
        >
          <option value="">Tous les cultes</option>
          {cultes.map(culte => (
            <option key={culte} value={culte}>{culte}</option>
          ))}
        </Select>
      </div>

      {/* Compteur de résultats */}
      <div className="mb-2 text-sm text-gray-600 flex-shrink-0">
        {filteredEntries.length} présence{filteredEntries.length > 1 ? 's' : ''} trouvée{filteredEntries.length > 1 ? 's' : ''}
      </div>

      {/* Modal de modification */}
      {editingPresence && onEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-slideIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faPencil} className="w-5 h-5 text-[#4a2b87]" />
              Modifier la présence
            </h2>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Membre: <span className="font-medium text-gray-800">{editingPresence.nom}</span></p>
              <p className="text-sm text-gray-600">Date: <span className="font-medium text-gray-800">{editingPresence.date}</span></p>
            </div>

            <div className="mb-4">
              <label className="block mb-1.5 text-gray-700 font-medium text-sm">Statut de présence</label>
              <div className="grid grid-cols-2 gap-3">
                <label 
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    editPresenceStatus === "Présent" 
                      ? 'border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32]' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="editPresence"
                    value="Présent"
                    checked={editPresenceStatus === "Présent"}
                    onChange={() => setEditPresenceStatus('Présent')}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">Présent</span>
                </label>
                <label 
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    editPresenceStatus === "Absent" 
                      ? 'border-[#c62828] bg-[#ffebee] text-[#c62828]' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="editPresence"
                    value="Absent"
                    checked={editPresenceStatus === "Absent"}
                    onChange={() => setEditPresenceStatus('Absent')}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">Absent</span>
                </label>
              </div>
            </div>

            <Select
              label="Culte"
              value={editCulte}
              onChange={(e) => setEditCulte(e.target.value)}
              className="mb-4"
            >
              <option value="1er culte">1er culte</option>
              <option value="2ème culte">2ème culte</option>
            </Select>
            
            <div className="flex gap-3">
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
      <div className="hidden lg:flex flex-col flex-1 min-h-0 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#4a2b87]">
                <th className="py-3 px-4 text-left text-white font-medium text-sm">Nom</th>
                <th className="py-3 px-4 text-left text-white font-medium text-sm">Téléphone</th>
                <th className="py-3 px-4 text-center text-white font-medium text-sm">Présence</th>
                <th className="py-3 px-4 text-center text-white font-medium text-sm">Culte</th>
                <th className="py-3 px-4 text-center text-white font-medium text-sm">Date</th>
                {(onEdit || onDelete) && (
                  <th className="py-3 px-4 text-center text-white font-medium text-sm">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={onEdit || onDelete ? 6 : 5} className="py-12 px-4 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FontAwesomeIcon icon={faClipboard} className="w-10 h-10 text-gray-300" />
                      <span className="text-sm">{searchName || filterCulte ? "Aucune présence trouvée" : "Aucune présence enregistrée"}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e, index) => (
                  <tr 
                    key={e.id} 
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="py-3 px-4 text-gray-800">{e.nom || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-sm">{e.telephone || "N/A"}</td>
                    <td className="py-3 px-4 text-center">{getPresenceBadge(e.presence, e.pkabsence)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#ede7f6] text-[#4a2b87]">
                        {e.culte || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500 text-sm">{e.date || "N/A"}</td>
                    {(onEdit || onDelete) && (
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-center">
                          {onEdit && (
                            <button
                              onClick={() => handleEditClick(e)}
                              className="p-2 rounded-lg text-[#4a2b87] hover:bg-[#4a2b87]/10 transition-colors"
                              title="Modifier"
                            >
                              <FontAwesomeIcon icon={faPencil} className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(e.id)}
                              className="p-2 rounded-lg text-[#d32f2f] hover:bg-[#d32f2f]/10 transition-colors"
                              title="Supprimer"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vue Mobile - Cartes avec scroll */}
      <div className="lg:hidden flex-1 min-h-0 overflow-auto space-y-3 pr-1">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-gray-200">
            <FontAwesomeIcon icon={faClipboard} className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <span className="text-sm">{searchName || filterCulte ? "Aucune présence trouvée" : "Aucune présence enregistrée"}</span>
          </div>
        ) : (
          filteredEntries.map(e => (
            <div 
              key={e.id} 
              className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-800">{e.nom}</h3>
                  <p className="text-gray-500 font-mono text-sm">
                    {e.telephone || "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getPresenceBadge(e.presence, e.pkabsence)}
                  {(onEdit || onDelete) && (
                    <div className="flex gap-1">
                      {onEdit && (
                        <button
                          onClick={() => handleEditClick(e)}
                          className="p-1.5 rounded-lg text-[#4a2b87] hover:bg-[#4a2b87]/10 transition-colors"
                        >
                          <FontAwesomeIcon icon={faPencil} className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(e.id)}
                          className="p-1.5 rounded-lg text-[#d32f2f] hover:bg-[#d32f2f]/10 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
                <span className="px-2 py-0.5 rounded bg-[#ede7f6] text-[#4a2b87] font-medium text-xs">
                  {e.culte}
                </span>
                <span className="text-gray-400 text-xs">
                  {e.date}
                </span>
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
        Télécharger la liste des présences
      </Button>
    </div>
  )
}

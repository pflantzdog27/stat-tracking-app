'use client'

import { useState, useRef } from 'react'
import { PlayerImportData } from '@/types/enhanced-database'
import { enhancedPlayerService } from '@/lib/services/enhanced-player-service'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface PlayerImportExportProps {
  teamId: string
  userId: string
  onImportComplete: () => void
  className?: string
}

export default function PlayerImportExport({ 
  teamId, 
  userId,
  onImportComplete,
  className = '' 
}: PlayerImportExportProps) {
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState<PlayerImportData[]>([])
  const [importResults, setImportResults] = useState<{ success: any[]; errors: any[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      setExportLoading(true)
      const csvContent = await enhancedPlayerService.exportPlayersToCSV(teamId)
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `players_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export players. Please try again.')
    } finally {
      setExportLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const csv = e.target?.result as string
      const players = parseCSV(csv)
      setImportData(players)
      setShowImportModal(true)
    }
    reader.readAsText(file)
  }

  const parseCSV = (csv: string): PlayerImportData[] => {
    const lines = csv.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
    const players: PlayerImportData[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const player: Partial<PlayerImportData> = {}

      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        if (!value) return

        switch (header) {
          case 'jerseynumber':
          case 'jersey':
          case 'number':
            player.jerseyNumber = parseInt(value)
            break
          case 'firstname':
          case 'first':
            player.firstName = value
            break
          case 'lastname':
          case 'last':
            player.lastName = value
            break
          case 'position':
          case 'pos':
            if (['F', 'D', 'G', 'Forward', 'Defense', 'Goalie'].includes(value)) {
              player.position = value.charAt(0).toUpperCase()
            }
            break
          case 'birthdate':
          case 'birthday':
          case 'dob':
            player.birthDate = value
            break
          case 'email':
            player.email = value
            break
          case 'phone':
            player.phone = value
            break
          case 'parentguardianname':
          case 'parent':
          case 'guardian':
            player.parentGuardianName = value
            break
          case 'parentemail':
          case 'parentguardianemail':
            player.parentGuardianEmail = value
            break
          case 'height':
          case 'heightinches':
            player.heightInches = parseInt(value)
            break
          case 'weight':
          case 'weightlbs':
            player.weightLbs = parseInt(value)
            break
          case 'shoots':
          case 'hand':
            if (['L', 'R', 'Left', 'Right'].includes(value)) {
              player.shoots = value.charAt(0).toUpperCase()
            }
            break
        }
      })

      if (player.firstName && player.lastName && player.jerseyNumber) {
        players.push(player as PlayerImportData)
      }
    }

    return players
  }

  const handleImport = async () => {
    if (importData.length === 0) return

    try {
      setLoading(true)
      const results = await enhancedPlayerService.bulkImportPlayers(teamId, importData, userId)
      setImportResults(results)

      if (results.errors.length === 0) {
        setTimeout(() => {
          setShowImportModal(false)
          onImportComplete()
          resetImport()
        }, 3000)
      }
    } catch (error) {
      setImportResults({
        success: [],
        errors: [{ row: 0, error: error instanceof Error ? error.message : 'Import failed' }]
      })
    } finally {
      setLoading(false)
    }
  }

  const resetImport = () => {
    setImportData([])
    setImportResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCloseImport = () => {
    setShowImportModal(false)
    resetImport()
  }

  const downloadTemplate = () => {
    const template = [
      'Jersey Number,First Name,Last Name,Position,Birth Date,Email,Phone,Parent Guardian Name,Parent Email,Height Inches,Weight Lbs,Shoots',
      '9,Connor,Wilson,F,2010-03-15,connor@example.com,(555) 123-4567,John Wilson,john.wilson@example.com,66,140,L',
      '11,Jake,Thompson,F,2010-07-22,jake@example.com,(555) 234-5678,Sarah Thompson,sarah.thompson@example.com,68,150,R'
    ].join('\n')

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'player_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Import/Export Players</h3>
            <p className="text-sm text-gray-600 mt-1">
              Bulk import players from CSV or export current roster
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="font-medium text-gray-900 mb-2">Download Template</h4>
            <p className="text-sm text-gray-600 mb-3">
              Get a CSV template with sample data
            </p>
            <Button size="sm" variant="ghost" onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>

          <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h4 className="font-medium text-gray-900 mb-2">Import Players</h4>
            <p className="text-sm text-gray-600 mb-3">
              Upload a CSV file with player data
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
            >
              Choose CSV File
            </Button>
          </div>

          <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="font-medium text-gray-900 mb-2">Export Players</h4>
            <p className="text-sm text-gray-600 mb-3">
              Download current roster as CSV
            </p>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={handleExport}
              loading={exportLoading}
            >
              Export CSV
            </Button>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p><strong>Supported CSV columns:</strong></p>
          <p>Jersey Number*, First Name*, Last Name*, Position, Birth Date, Email, Phone, Parent Guardian Name, Parent Email, Height Inches, Weight Lbs, Shoots</p>
          <p className="mt-1">* Required fields</p>
        </div>
      </div>

      {/* Import Preview Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={handleCloseImport}
        title="Import Players"
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {!importResults ? (
            <>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Preview Import ({importData.length} players)
                </h4>
                <p className="text-sm text-blue-700">
                  Review the players below before importing. Missing or invalid data will be highlighted.
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importData.map((player, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 text-sm">
                          <span className={!player.jerseyNumber ? 'text-red-600 font-medium' : ''}>
                            {player.jerseyNumber || 'Missing'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span className={!player.firstName || !player.lastName ? 'text-red-600 font-medium' : ''}>
                            {player.firstName} {player.lastName}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm">{player.position || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{player.email || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{player.parentGuardianName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="ghost" onClick={handleCloseImport}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  loading={loading}
                  disabled={loading || importData.length === 0}
                >
                  {loading ? 'Importing...' : `Import ${importData.length} Players`}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {importResults.success.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Successfully Imported ({importResults.success.length})
                      </h3>
                      <p className="mt-1 text-sm text-green-700">
                        {importResults.success.length} player{importResults.success.length !== 1 ? 's' : ''} have been added to your roster.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Import Errors ({importResults.errors.length})
                      </h3>
                      <ul className="mt-2 text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                        {importResults.errors.map((error, index) => (
                          <li key={index}>Row {error.row}: {error.error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleCloseImport}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
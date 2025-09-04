'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

interface PenaltyModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (penaltyType: string, minutes: number, description: string) => void
  playerName: string
}

export default function PenaltyModal({ isOpen, onClose, onSubmit, playerName }: PenaltyModalProps) {
  const [penaltyType, setPenaltyType] = useState('')
  const [minutes, setMinutes] = useState(2)
  const [description, setDescription] = useState('')

  const penaltyTypes = [
    { value: 'tripping', label: 'Tripping', defaultMinutes: 2 },
    { value: 'slashing', label: 'Slashing', defaultMinutes: 2 },
    { value: 'hooking', label: 'Hooking', defaultMinutes: 2 },
    { value: 'interference', label: 'Interference', defaultMinutes: 2 },
    { value: 'high_sticking', label: 'High Sticking', defaultMinutes: 2 },
    { value: 'cross_checking', label: 'Cross Checking', defaultMinutes: 2 },
    { value: 'boarding', label: 'Boarding', defaultMinutes: 2 },
    { value: 'checking_from_behind', label: 'Checking from Behind', defaultMinutes: 5 },
    { value: 'fighting', label: 'Fighting', defaultMinutes: 5 },
    { value: 'roughing', label: 'Roughing', defaultMinutes: 2 },
    { value: 'unsportsmanlike', label: 'Unsportsmanlike Conduct', defaultMinutes: 2 },
    { value: 'delay_of_game', label: 'Delay of Game', defaultMinutes: 2 },
    { value: 'too_many_men', label: 'Too Many Men', defaultMinutes: 2 },
    { value: 'misconduct', label: 'Misconduct', defaultMinutes: 10 },
    { value: 'game_misconduct', label: 'Game Misconduct', defaultMinutes: 10 }
  ]

  const handlePenaltyTypeChange = (value: string) => {
    setPenaltyType(value)
    const penalty = penaltyTypes.find(p => p.value === value)
    if (penalty) {
      setMinutes(penalty.defaultMinutes)
      setDescription(`${penalty.label} - ${penalty.defaultMinutes} minutes`)
    }
  }

  const handleSubmit = () => {
    if (!penaltyType) return
    
    onSubmit(penaltyType, minutes, description || `${penaltyTypes.find(p => p.value === penaltyType)?.label} - ${minutes} minutes`)
    
    // Reset form
    setPenaltyType('')
    setMinutes(2)
    setDescription('')
    onClose()
  }

  const handleClose = () => {
    setPenaltyType('')
    setMinutes(2)
    setDescription('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Penalty - ${playerName}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Penalty Type *
          </label>
          <Select
            value={penaltyType}
            onChange={(e) => handlePenaltyTypeChange(e.target.value)}
            className="w-full"
          >
            <option value="">Select penalty type</option>
            {penaltyTypes.map((penalty) => (
              <option key={penalty.value} value={penalty.value}>
                {penalty.label} ({penalty.defaultMinutes} min)
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minutes
          </label>
          <Select
            value={minutes.toString()}
            onChange={(e) => setMinutes(parseInt(e.target.value))}
            className="w-full"
          >
            <option value="2">2 minutes (Minor)</option>
            <option value="4">4 minutes (Double Minor)</option>
            <option value="5">5 minutes (Major)</option>
            <option value="10">10 minutes (Misconduct)</option>
            <option value="20">Game Misconduct</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional details..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!penaltyType}>
            Record Penalty
          </Button>
        </div>
      </div>
    </Modal>
  )
}
'use client'

import { useState } from 'react'

interface ExportActionsProps {
  onExport: (format: 'csv' | 'pdf') => Promise<void>
  disabled?: boolean
  className?: string
}

export default function ExportActions({
  onExport,
  disabled = false,
  className = ''
}: ExportActionsProps) {
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (disabled || isExporting) return

    try {
      setIsExporting(format)
      setDropdownOpen(false)
      await onExport(format)
    } catch (error) {
      console.error(`${format.toUpperCase()} export failed:`, error)
    } finally {
      setIsExporting(null)
    }
  }

  const exportOptions = [
    {
      format: 'csv' as const,
      label: 'Export as CSV',
      description: 'Spreadsheet format for data analysis',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      format: 'pdf' as const,
      label: 'Export as PDF',
      description: 'Formatted report for sharing',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ]

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={disabled || isExporting !== null}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          disabled || isExporting
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
        }`}
      >
        {isExporting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Exporting {isExporting.toUpperCase()}...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {exportOptions.map((option) => (
              <button
                key={option.format}
                onClick={() => handleExport(option.format)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-start space-x-3"
              >
                <div className="flex-shrink-0 text-gray-400 mt-0.5">
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Share Options */}
          <div className="border-t border-gray-100 py-1">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Share
            </div>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Team Statistics',
                    text: 'Check out these team statistics',
                    url: window.location.href,
                  })
                } else {
                  // Fallback: copy URL to clipboard
                  navigator.clipboard.writeText(window.location.href)
                  alert('Link copied to clipboard!')
                }
                setDropdownOpen(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">Share Link</div>
                <div className="text-xs text-gray-500">Copy URL to clipboard</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  )
}
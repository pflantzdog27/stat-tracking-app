'use client'

import { ReactNode } from 'react'

interface StatButtonProps {
  icon?: ReactNode
  label: string
  count?: number
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick: () => void
  className?: string
}

export default function StatButton({
  icon,
  label,
  count,
  color = 'blue',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = ''
}: StatButtonProps) {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-blue-200',
    green: 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-green-200',
    red: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-red-200',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white shadow-yellow-200',
    purple: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white shadow-purple-200',
    gray: 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white shadow-gray-200'
  }

  const sizeClasses = {
    sm: 'p-3 text-sm min-h-[60px]',
    md: 'p-4 text-base min-h-[80px]',
    lg: 'p-6 text-lg min-h-[100px]'
  }

  const handleClick = () => {
    if (!disabled && !loading) {
      onClick()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative flex flex-col items-center justify-center rounded-lg font-medium
        transition-all duration-150 shadow-lg
        ${colorClasses[color]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${loading ? 'cursor-wait' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
      ) : (
        <>
          {icon && (
            <div className="mb-1 flex items-center justify-center">
              {icon}
            </div>
          )}
          
          <div className="text-center leading-tight">
            {label}
          </div>
          
          {count !== undefined && (
            <div className="absolute -top-2 -right-2 bg-white text-gray-900 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
              {count}
            </div>
          )}
        </>
      )}
    </button>
  )
}

// Hockey-specific stat button components
export function GoalButton(props: Omit<StatButtonProps, 'icon' | 'color'>) {
  return (
    <StatButton
      {...props}
      color="green"
      icon={
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      }
    />
  )
}

export function AssistButton(props: Omit<StatButtonProps, 'icon' | 'color'>) {
  return (
    <StatButton
      {...props}
      color="blue"
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      }
    />
  )
}

export function ShotButton(props: Omit<StatButtonProps, 'icon' | 'color'>) {
  return (
    <StatButton
      {...props}
      color="yellow"
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
    />
  )
}

export function PenaltyButton(props: Omit<StatButtonProps, 'icon' | 'color'>) {
  return (
    <StatButton
      {...props}
      color="red"
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
    />
  )
}

export function HitButton(props: Omit<StatButtonProps, 'icon' | 'color'>) {
  return (
    <StatButton
      {...props}
      color="purple"
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      }
    />
  )
}

export function SaveButton(props: Omit<StatButtonProps, 'icon' | 'color'>) {
  return (
    <StatButton
      {...props}
      color="blue"
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
  )
}
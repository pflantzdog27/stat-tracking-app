import { forwardRef } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  children: React.ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error = false, children, ...props }, ref) => {
    const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm text-sm bg-white focus:outline-none focus:ring-1 transition-colors'
    const errorClasses = error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    
    const classes = `${baseClasses} ${errorClasses} ${className}`

    return (
      <select
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'

export default Select
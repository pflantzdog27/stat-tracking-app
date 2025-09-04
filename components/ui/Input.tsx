import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, ...props }, ref) => {
    const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors'
    const errorClasses = error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    
    const classes = `${baseClasses} ${errorClasses} ${className}`

    return (
      <input
        ref={ref}
        className={classes}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input
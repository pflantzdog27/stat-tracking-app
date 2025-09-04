export default function LoadingSpinner({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6', 
    large: 'w-8 h-8'
  }

  return (
    <div className="flex justify-center items-center p-4">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`} />
    </div>
  )
}
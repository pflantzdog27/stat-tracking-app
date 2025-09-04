import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h2 className="text-6xl font-bold text-gray-400">403</h2>
          <h3 className="mt-4 text-2xl font-bold text-gray-900">Access Denied</h3>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-block w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Dashboard
          </Link>
          
          <Link
            href="/auth/login"
            className="inline-block w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Login with Different Account
          </Link>
        </div>
      </div>
    </div>
  )
}
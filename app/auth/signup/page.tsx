'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Layout from '@/components/layout/Layout'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      await register({
        email,
        password,
        firstName: email.split('@')[0], // Use part before @ as temporary first name
        lastName: 'User' // Temporary last name
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen flex">
        {/* Left side - Hockey branded illustration */}
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-800">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Abstract hockey scene */}
              <div className="relative w-96 h-64 transform -rotate-12">
                {/* Rink outline */}
                <div className="absolute inset-0 border-4 border-white rounded-full opacity-60"></div>
                
                {/* Center line and circle */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white opacity-60 transform -translate-y-0.5"></div>
                <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white rounded-full opacity-60 transform -translate-x-1/2 -translate-y-1/2"></div>
                
                {/* Goal areas */}
                <div className="absolute top-1/2 left-4 w-8 h-16 border-2 border-white border-r-0 rounded-l-full opacity-60 transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 right-4 w-8 h-16 border-2 border-white border-l-0 rounded-r-full opacity-60 transform -translate-y-1/2"></div>
                
                {/* Multiple pucks scattered */}
                <div className="w-3 h-3 bg-white rounded-sm opacity-90 absolute top-12 left-20"></div>
                <div className="w-3 h-3 bg-white rounded-sm opacity-70 absolute top-32 right-24"></div>
                <div className="w-3 h-3 bg-white rounded-sm opacity-80 absolute bottom-16 left-32"></div>
                
                {/* Hockey stick */}
                <div className="absolute top-16 left-32 transform -rotate-12">
                  <div className="w-1 h-20 bg-white rounded-full opacity-80"></div>
                  <div className="w-5 h-2 bg-white rounded-sm opacity-80 transform rotate-12 -translate-x-1"></div>
                </div>
              </div>
              
              {/* Goal net representation */}
              <div className="absolute bottom-24 left-16 opacity-40">
                <div className="w-12 h-8 border-2 border-white border-b-0 rounded-t-lg"></div>
                <div className="w-12 h-0.5 bg-white"></div>
              </div>
            </div>
            
            {/* Overlay text */}
            <div className="absolute bottom-12 left-12 text-white">
              <h3 className="text-3xl font-bold mb-2">Join the Game</h3>
              <p className="text-green-100 text-lg">Start tracking your team's performance today</p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="ml-3 text-2xl font-bold text-gray-900">StatTracker</h1>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="font-medium text-green-600 hover:text-green-500">
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="mt-8">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Create a password"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="agree-terms"
                    name="agree-terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                    I agree to the{' '}
                    <Link href="/terms" className="text-green-600 hover:text-green-500">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-green-600 hover:text-green-500">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
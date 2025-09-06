'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Layout from '@/components/layout/Layout'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="ml-3 text-2xl font-bold text-gray-900">StatTracker</h1>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up now
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
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right side - Hockey branded illustration */}
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Abstract hockey rink */}
              <div className="relative w-96 h-64 transform rotate-12">
                {/* Rink outline */}
                <div className="absolute inset-0 border-4 border-white rounded-full opacity-60"></div>
                
                {/* Center line and circle */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white opacity-60 transform -translate-y-0.5"></div>
                <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white rounded-full opacity-60 transform -translate-x-1/2 -translate-y-1/2"></div>
                
                {/* Goal creases */}
                <div className="absolute top-1/2 left-4 w-8 h-16 border-2 border-white border-r-0 rounded-l-full opacity-60 transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 right-4 w-8 h-16 border-2 border-white border-l-0 rounded-r-full opacity-60 transform -translate-y-1/2"></div>
                
                {/* Face-off circles */}
                <div className="absolute top-8 left-16 w-8 h-8 border-2 border-white rounded-full opacity-40"></div>
                <div className="absolute top-8 right-16 w-8 h-8 border-2 border-white rounded-full opacity-40"></div>
                <div className="absolute bottom-8 left-16 w-8 h-8 border-2 border-white rounded-full opacity-40"></div>
                <div className="absolute bottom-8 right-16 w-8 h-8 border-2 border-white rounded-full opacity-40"></div>
              </div>
              
              {/* Hockey stick and puck */}
              <div className="absolute bottom-20 right-20 transform rotate-45">
                <div className="w-1 h-24 bg-white rounded-full opacity-80"></div>
                <div className="w-6 h-3 bg-white rounded-sm opacity-80 transform -rotate-45 -translate-x-2"></div>
              </div>
              <div className="w-4 h-4 bg-white rounded-sm opacity-90 absolute bottom-16 right-16"></div>
            </div>
            
            {/* Overlay text */}
            <div className="absolute bottom-12 left-12 text-white">
              <h3 className="text-3xl font-bold mb-2">Track Every Play</h3>
              <p className="text-blue-100 text-lg">Professional hockey statistics at your fingertips</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
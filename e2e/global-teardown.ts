import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...')
  
  try {
    // Clean up test data if needed
    console.log('🗑️  Cleaning up test data...')
    
    // Clear any test files or temporary data
    // This could include clearing test databases, uploaded files, etc.
    
    // Log test summary if available
    console.log('📊 Test run completed')
    
    console.log('✅ Global teardown completed')
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error to avoid masking test failures
  }
}

export default globalTeardown
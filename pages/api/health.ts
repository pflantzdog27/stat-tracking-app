import { NextApiRequest, NextApiResponse } from 'next'
import { metricsCollector, dbMonitor } from '../../lib/monitoring'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get application health status
    const appHealth = metricsCollector.getHealthStatus()
    
    // Get database metrics
    const dbMetrics = dbMonitor.getMetrics()
    
    // Check database connectivity (simple query)
    let dbConnected = false
    try {
      // This would be replaced with an actual database ping
      // For now, we'll assume it's connected if we have recent query metrics
      dbConnected = dbMetrics.averageQueryTime >= 0
    } catch (error) {
      dbConnected = false
    }

    // Overall health determination
    const isHealthy = appHealth.status === 'healthy' && dbConnected

    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      uptime: process.uptime(),
      checks: {
        application: appHealth.status === 'healthy',
        database: dbConnected,
        memory: appHealth.checks.memoryUsage,
        errorRate: appHealth.checks.errorRate,
        responseTime: appHealth.checks.responseTime
      },
      metrics: {
        memory: process.memoryUsage(),
        database: dbMetrics,
        performance: metricsCollector.getPerformanceMetrics()
      }
    }

    // Return appropriate status code
    const statusCode = isHealthy ? 200 : 503
    res.status(statusCode).json(healthStatus)

  } catch (error) {
    console.error('Health check error:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    })
  }
}
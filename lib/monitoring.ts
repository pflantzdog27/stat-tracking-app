// Application monitoring and metrics collection
import { NextApiRequest, NextApiResponse } from 'next'

interface MetricPoint {
  name: string
  value: number
  timestamp: number
  labels?: Record<string, string>
}

interface PerformanceMetrics {
  responseTime: number
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: number
  requestCount: number
  errorCount: number
  activeConnections: number
}

class MetricsCollector {
  private metrics: MetricPoint[] = []
  private requestCounts: Map<string, number> = new Map()
  private errorCounts: Map<string, number> = new Map()
  private responseTimes: Map<string, number[]> = new Map()
  private startTime: number = Date.now()

  // Record a metric point
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      labels
    })

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  // Record HTTP request
  recordRequest(method: string, path: string, statusCode: number, responseTime: number): void {
    const key = `${method}:${path}`
    
    // Update request count
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1)
    
    // Update error count if error status
    if (statusCode >= 400) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1)
    }
    
    // Update response times
    const times = this.responseTimes.get(key) || []
    times.push(responseTime)
    if (times.length > 100) times.shift() // Keep last 100 response times
    this.responseTimes.set(key, times)

    // Record as metrics
    this.recordMetric('http_requests_total', 1, {
      method,
      path,
      status: statusCode.toString()
    })

    this.recordMetric('http_request_duration_seconds', responseTime / 1000, {
      method,
      path
    })
  }

  // Get performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage()
    
    return {
      responseTime: this.getAverageResponseTime(),
      memoryUsage,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      requestCount: Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0),
      errorCount: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0),
      activeConnections: 0 // Would need to be implemented based on your setup
    }
  }

  // Get average response time across all endpoints
  private getAverageResponseTime(): number {
    const allTimes: number[] = []
    for (const times of this.responseTimes.values()) {
      allTimes.push(...times)
    }
    
    if (allTimes.length === 0) return 0
    return allTimes.reduce((a, b) => a + b, 0) / allTimes.length
  }

  // Export metrics in Prometheus format
  exportPrometheusMetrics(): string {
    let output = ''
    
    // Basic app info
    output += `# HELP app_info Application information\n`
    output += `# TYPE app_info gauge\n`
    output += `app_info{version="${process.env.npm_package_version || 'unknown'}"} 1\n\n`

    // Uptime
    const uptime = (Date.now() - this.startTime) / 1000
    output += `# HELP app_uptime_seconds Application uptime in seconds\n`
    output += `# TYPE app_uptime_seconds counter\n`
    output += `app_uptime_seconds ${uptime}\n\n`

    // Memory metrics
    const memory = process.memoryUsage()
    output += `# HELP process_memory_usage_bytes Memory usage in bytes\n`
    output += `# TYPE process_memory_usage_bytes gauge\n`
    output += `process_memory_usage_bytes{type="rss"} ${memory.rss}\n`
    output += `process_memory_usage_bytes{type="heapTotal"} ${memory.heapTotal}\n`
    output += `process_memory_usage_bytes{type="heapUsed"} ${memory.heapUsed}\n`
    output += `process_memory_usage_bytes{type="external"} ${memory.external}\n\n`

    // Request counts
    output += `# HELP http_requests_total Total HTTP requests\n`
    output += `# TYPE http_requests_total counter\n`
    for (const [key, count] of this.requestCounts.entries()) {
      const [method, path] = key.split(':')
      output += `http_requests_total{method="${method}",path="${path}"} ${count}\n`
    }
    output += '\n'

    // Error counts
    output += `# HELP http_errors_total Total HTTP errors\n`
    output += `# TYPE http_errors_total counter\n`
    for (const [key, count] of this.errorCounts.entries()) {
      const [method, path] = key.split(':')
      output += `http_errors_total{method="${method}",path="${path}"} ${count}\n`
    }
    output += '\n'

    // Response times
    output += `# HELP http_request_duration_seconds HTTP request duration\n`
    output += `# TYPE http_request_duration_seconds histogram\n`
    for (const [key, times] of this.responseTimes.entries()) {
      const [method, path] = key.split(':')
      const avg = times.reduce((a, b) => a + b, 0) / times.length / 1000
      output += `http_request_duration_seconds{method="${method}",path="${path}"} ${avg}\n`
    }

    return output
  }

  // Clear old metrics
  clearOldMetrics(olderThanMs: number = 3600000): void { // Default: 1 hour
    const cutoff = Date.now() - olderThanMs
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
  }

  // Get health status
  getHealthStatus(): { status: 'healthy' | 'unhealthy', checks: Record<string, boolean> } {
    const memory = process.memoryUsage()
    const memoryUsagePercent = (memory.heapUsed / memory.heapTotal) * 100
    
    const recentErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0)
    const recentRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0)
    const errorRate = recentRequests > 0 ? (recentErrors / recentRequests) * 100 : 0

    const checks = {
      memoryUsage: memoryUsagePercent < 90, // Memory usage under 90%
      errorRate: errorRate < 10, // Error rate under 10%
      responseTime: this.getAverageResponseTime() < 5000 // Average response time under 5s
    }

    const status = Object.values(checks).every(Boolean) ? 'healthy' : 'unhealthy'

    return { status, checks }
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector()

// Middleware for automatic request tracking
export function withMetrics(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now()
    
    try {
      await handler(req, res)
    } catch (error) {
      console.error('API Error:', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' })
      }
    } finally {
      const responseTime = Date.now() - startTime
      const statusCode = res.statusCode || 500
      
      metricsCollector.recordRequest(
        req.method || 'UNKNOWN',
        req.url || '/unknown',
        statusCode,
        responseTime
      )
    }
  }
}

// Database performance monitoring
interface DatabaseMetrics {
  connectionCount: number
  slowQueryCount: number
  averageQueryTime: number
  errorCount: number
}

export class DatabaseMonitor {
  private queryTimes: number[] = []
  private slowQueries: number = 0
  private errors: number = 0

  recordQuery(duration: number, isError: boolean = false): void {
    this.queryTimes.push(duration)
    
    // Keep only last 100 query times
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift()
    }

    // Track slow queries (>1000ms)
    if (duration > 1000) {
      this.slowQueries++
    }

    if (isError) {
      this.errors++
    }

    // Record to main metrics collector
    metricsCollector.recordMetric('db_query_duration_ms', duration)
    if (isError) {
      metricsCollector.recordMetric('db_errors_total', 1)
    }
  }

  getMetrics(): DatabaseMetrics {
    return {
      connectionCount: 0, // Would need to be implemented based on your DB setup
      slowQueryCount: this.slowQueries,
      averageQueryTime: this.queryTimes.length > 0 
        ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length 
        : 0,
      errorCount: this.errors
    }
  }

  reset(): void {
    this.queryTimes = []
    this.slowQueries = 0
    this.errors = 0
  }
}

export const dbMonitor = new DatabaseMonitor()

// Custom business metrics
export class BusinessMetrics {
  recordPlayerView(playerId: string): void {
    metricsCollector.recordMetric('player_views_total', 1, { player_id: playerId })
  }

  recordGameView(gameId: string): void {
    metricsCollector.recordMetric('game_views_total', 1, { game_id: gameId })
  }

  recordSearchQuery(query: string, resultCount: number): void {
    metricsCollector.recordMetric('search_queries_total', 1, { 
      query_length: query.length.toString(),
      has_results: (resultCount > 0).toString()
    })
    metricsCollector.recordMetric('search_results_count', resultCount)
  }

  recordExportRequest(format: string, dataType: string): void {
    metricsCollector.recordMetric('export_requests_total', 1, { 
      format, 
      data_type: dataType 
    })
  }

  recordCacheHit(cacheKey: string): void {
    metricsCollector.recordMetric('cache_hits_total', 1, { cache_key: cacheKey })
  }

  recordCacheMiss(cacheKey: string): void {
    metricsCollector.recordMetric('cache_misses_total', 1, { cache_key: cacheKey })
  }
}

export const businessMetrics = new BusinessMetrics()

// Alert system
interface Alert {
  id: string
  level: 'info' | 'warning' | 'critical'
  message: string
  timestamp: number
  resolved: boolean
}

export class AlertManager {
  private alerts: Alert[] = []
  private webhookUrl?: string

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl
  }

  createAlert(level: Alert['level'], message: string): string {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      timestamp: Date.now(),
      resolved: false
    }

    this.alerts.push(alert)

    // Send webhook notification for warnings and critical alerts
    if ((level === 'warning' || level === 'critical') && this.webhookUrl) {
      this.sendWebhookNotification(alert)
    }

    return alert.id
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      return true
    }
    return false
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved)
  }

  private async sendWebhookNotification(alert: Alert): Promise<void> {
    if (!this.webhookUrl) return

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${alert.level.toUpperCase()}: ${alert.message}`,
          alert_id: alert.id,
          timestamp: new Date(alert.timestamp).toISOString()
        })
      })

      if (!response.ok) {
        console.error('Failed to send webhook notification:', response.statusText)
      }
    } catch (error) {
      console.error('Error sending webhook notification:', error)
    }
  }
}

export const alertManager = new AlertManager(process.env.ALERT_WEBHOOK_URL)

// Performance monitoring decorator
export function monitored(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now()
    const methodName = `${target.constructor.name}.${propertyName}`

    try {
      const result = await method.apply(this, args)
      const duration = Date.now() - startTime
      
      metricsCollector.recordMetric('method_duration_ms', duration, { method: methodName })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      metricsCollector.recordMetric('method_errors_total', 1, { method: methodName })
      metricsCollector.recordMetric('method_duration_ms', duration, { 
        method: methodName, 
        status: 'error' 
      })
      throw error
    }
  }

  return descriptor
}
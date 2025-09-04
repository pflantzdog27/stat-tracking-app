import { NextApiRequest, NextApiResponse } from 'next'
import { metricsCollector } from '../../lib/monitoring'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const prometheusMetrics = metricsCollector.exportPrometheusMetrics()
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.status(200).send(prometheusMetrics)
  } catch (error) {
    console.error('Error exporting metrics:', error)
    res.status(500).json({ error: 'Failed to export metrics' })
  }
}
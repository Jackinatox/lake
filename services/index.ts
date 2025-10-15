import { Cron } from 'croner'
import { runMaintenance } from './expiredServers/maintenance'
import { workerState } from './expiredServers/status'

// Track if maintenance is currently running
let isMaintenanceRunning = false

// Schedule every 15 minutes
new Cron('*/15 * * * *', async () => {
    console.log('[cron] Running maintenance')
    await runMaintenanceWithTracking()
})

async function runMaintenanceWithTracking() {
    if (isMaintenanceRunning) {
        console.log('[maintenance] Already running, skipping')
        return
    }
    
    isMaintenanceRunning = true
    try {
        await runMaintenance()
    } catch (error) {
        console.error('[maintenance] Error:', error)
    } finally {
        isMaintenanceRunning = false
    }
}

// Expose local API for manual triggers
// @ts-expect-error Bun global is available when running with Bun
Bun.serve({
    port: 4000,
    async fetch(req) {
        const url = new URL(req.url)
        console.log(url.href)

        if (url.pathname === '/run' && req.method === 'POST') {
            // Start maintenance in background (fire-and-forget)
            if (!isMaintenanceRunning) {
                runMaintenanceWithTracking()
            }
            
            // Return immediately with current state
            return new Response(JSON.stringify({ 
                status: workerState.expiredServers,
                isRunning: isMaintenanceRunning,
                message: isMaintenanceRunning ? 'Maintenance already running' : 'Maintenance started'
            }), { status: 202 }) // 202 = Accepted (processing in background)
        }

        if (req.method === "GET" && url.pathname === "/status") {
            return Response.json({
                ...workerState,
                isRunning: isMaintenanceRunning
            });
        }

        return new Response('Not Found', { status: 404 })
    },
})

console.log('Maintenance service started on :4000')

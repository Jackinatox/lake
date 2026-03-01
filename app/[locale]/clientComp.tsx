'use client'

import { Button } from '@/components/ui/button'
import posthog from 'posthog-js'

export default function PosthogClientComp() {
    function handlePurchase() {
        posthog.capture('purchase_completed', { amount: 99 })
    }

    return <Button onClick={handlePurchase}>Complete purchase</Button>
}
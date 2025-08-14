"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import checkIfServerReady from "./checkIfServerReady"
import { useTranslations } from "next-intl"
import { GameServerStatus } from "@/types/gameData"


const ERROR_STATES: ReadonlySet<GameServerStatus> = new Set([
  GameServerStatus.DOES_NOT_EXIST,
  GameServerStatus.PAYMENT_FAILED,
  GameServerStatus.CREATION_FAILED,
  GameServerStatus.EXPIRED,
  GameServerStatus.DELETED
])

export default function ServerReadyPoller({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<GameServerStatus | null>(null)
  const [serverId, setServerId] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)

  const t = useTranslations();
  const statusTitle = (s: GameServerStatus) => {
    const name = GameServerStatus[s]
    const key = `status.${name}.title`
    try {
      const val = t(key as any)
      return typeof val === "string" && val !== key ? val : name
    } catch {
      return name
    }
  }
  const statusMessage = (s: GameServerStatus) => {
    const name = GameServerStatus[s]
    const key = `status.${name}.message`
    try {
      const val = t(key as any)
      return typeof val === "string" && val !== key ? val : ""
    } catch {
      return ""
    }
  }

  useEffect(() => {
    let stopped = false
    let timeoutId: number | undefined

    const poll = async () => {
      if (stopped) return
      try {
        const { status, serverId } = await checkIfServerReady(sessionId)
        if (stopped) return
        setStatus(status)
        if (serverId) {
          setServerId(serverId)
          return // stop polling
        }
        if (ERROR_STATES.has(status)) {
          return // stop polling on error state
        }
        timeoutId = window.setTimeout(poll, 1000)
      } catch (e) {
        if (stopped) return
        setNetworkError(e instanceof Error ? e.message : "Unknown error")
        return // stop on network error
      }
    }

    poll()

    return () => {
      stopped = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [sessionId])

  const isError = status != null && ERROR_STATES.has(status)
  const isSuccess = !!serverId

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto p-8 text-center space-y-4">
        {!isSuccess && !isError && !networkError && (
          <>
            <h2 className="text-xl font-semibold text-gray-900">
              {status != null ? statusTitle(status) : "Checking status..."}
            </h2>
            {status != null && (
              <p className="text-gray-600">{statusMessage(status)}</p>
            )}
          </>
        )}

        {networkError && (
          <>
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
            <p className="text-gray-600">{networkError}</p>
          </>
        )}

        {isError && status != null && (
          <>
            <h2 className="text-xl font-semibold text-red-600">{statusTitle(status)}</h2>
            <p className="text-gray-600">{statusMessage(status)}</p>
          </>
        )}

        {isSuccess && (
          <>
            <h2 className="text-xl font-semibold text-green-700">{statusTitle(GameServerStatus.ACTIVE)}</h2>
            <p className="text-gray-600">{statusMessage(GameServerStatus.ACTIVE)}</p>
            <div className="pt-2">
              <Link
                href={`/gameserver/${serverId}`}
                className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded"
              >
                Go to server
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  CheckCircle2,
  LifeBuoy,
  Loader2,
  Server as ServerIcon,
  ShieldCheck,
  Sparkles,
  WifiOff
} from "lucide-react"

import checkIfServerReady from "./checkIfServerReady"
import { GameServerStatus } from "@/types/gameData"
import { Button } from "@/components/ui/button"

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
  const [pollingSignal, setPollingSignal] = useState(0)
  const [countdown, setCountdown] = useState(10)
  const [isCountdownActive, setIsCountdownActive] = useState(false)

  const translations = useTranslations()
  const pollerT = useTranslations("checkout.return.poller")
  const router = useRouter()

  const statusTitle = (s: GameServerStatus) => {
    const name = GameServerStatus[s]
    const key = `status.${name}.title`
    try {
      const val = translations(key as any)
      return typeof val === "string" && val !== key ? val : name
    } catch {
      return name
    }
  }
  const statusMessage = (s: GameServerStatus) => {
    const name = GameServerStatus[s]
    const key = `status.${name}.message`
    try {
      const val = translations(key as any)
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
        setNetworkError(null)
        const { status, serverId } = await checkIfServerReady(sessionId)
        if (stopped) return
        setStatus(status)
        if (serverId) {
          setServerId(serverId)
          return
        }
        if (ERROR_STATES.has(status)) {
          return
        }
        timeoutId = window.setTimeout(poll, 1000)
      } catch (e) {
        if (stopped) return
        setNetworkError(e instanceof Error ? e.message : pollerT("unknownError"))
      }
    }

    poll()

    return () => {
      stopped = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [sessionId, pollerT, pollingSignal])

  useEffect(() => {
    if (!serverId) {
      if (isCountdownActive) {
        setIsCountdownActive(false)
      }
      return
    }
    if (!isCountdownActive) {
      setCountdown(10)
      setIsCountdownActive(true)
    }
  }, [serverId, isCountdownActive])

  useEffect(() => {
    if (!isCountdownActive || !serverId) return
    if (countdown <= 0) {
      setIsCountdownActive(false)
      router.push(`/gameserver/${encodeURIComponent(serverId)}?start=true`)
      return
    }
    const timer = window.setTimeout(() => {
      setCountdown((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [countdown, isCountdownActive, router, serverId])

  const isError = status != null && ERROR_STATES.has(status)
  const isSuccess = !!serverId

  const mainTitle = useMemo(() => {
    if (networkError) return pollerT("networkHeadline")
    if (isError) return pollerT("errorHeadline")
    if (isSuccess) return pollerT("successHeadline")
    return pollerT("headline")
  }, [networkError, isError, isSuccess, pollerT])

  const subTitle = useMemo(() => {
    if (networkError) return pollerT("networkSubheadline")
    if (isError) return pollerT("errorSubheadline")
    if (isSuccess) return pollerT("successSubheadline")
    return pollerT("subheadline")
  }, [networkError, isError, isSuccess, pollerT])

  const headline = useMemo(() => {
    if (networkError) return pollerT("networkErrorTitle")
    if (isError && status != null) return statusTitle(status)
    if (isSuccess) return statusTitle(GameServerStatus.ACTIVE)
    if (status != null) return statusTitle(status)
    return pollerT("statusUnknown")
  }, [networkError, pollerT, isError, status, isSuccess])

  const description = useMemo(() => {
    if (networkError) return pollerT("networkErrorMessage")
    if (isError && status != null) return statusMessage(status)
    if (isSuccess) return statusMessage(GameServerStatus.ACTIVE)
    if (status != null) return statusMessage(status)
    return pollerT("statusUnknownDescription")
  }, [networkError, pollerT, isError, status, isSuccess])

  const Icon = useMemo(() => {
    if (networkError) return WifiOff
    if (isError) return AlertTriangle
    if (isSuccess) return CheckCircle2
    if (status != null) return ServerIcon
    return Loader2
  }, [networkError, isError, isSuccess, status])

  const iconContainerClass = useMemo(() => {
    if (networkError || isError) return "bg-destructive/15 text-destructive"
    if (isSuccess) return "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"
    return "bg-primary/10 text-primary"
  }, [networkError, isError, isSuccess])

  const cardBorderClass = useMemo(() => {
    if (networkError || isError) return "border-destructive/40"
    if (isSuccess) return "border-emerald-500/40"
    return "border-border/60"
  }, [networkError, isError, isSuccess])

  const statusToneClass = useMemo(() => {
    if (networkError || isError) return "text-destructive"
    if (isSuccess) return "text-emerald-500 dark:text-emerald-400"
    return "text-foreground"
  }, [networkError, isError, isSuccess])

  const descriptionClass = useMemo(() => {
    if (networkError || isError) return "text-sm text-destructive md:text-base"
    if (isSuccess) return "text-sm text-emerald-500 dark:text-emerald-400 md:text-base"
    return "text-sm text-muted-foreground md:text-base"
  }, [networkError, isError, isSuccess])

  const subTitleClass = useMemo(() => {
    if (networkError || isError) return "text-sm text-destructive md:text-base"
    if (isSuccess) return "text-sm text-emerald-500 dark:text-emerald-400 md:text-base"
    return "text-sm text-muted-foreground md:text-base"
  }, [networkError, isError, isSuccess])

  const mainTitleClass = useMemo(() => {
    if (networkError || isError) return "text-destructive"
    if (isSuccess) return "text-emerald-500 dark:text-emerald-400"
    return "text-foreground"
  }, [networkError, isError, isSuccess])

  const featureItems = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: pollerT("feature1Title"),
        description: pollerT("feature1Description")
      },
      {
        icon: Sparkles,
        title: pollerT("feature2Title"),
        description: pollerT("feature2Description")
      },
      {
        icon: LifeBuoy,
        title: pollerT("feature3Title"),
        description: pollerT("feature3Description")
      }
    ],
    [pollerT]
  )

  const showLoader = !isSuccess && !isError && !networkError

  const handleRetry = () => {
    setNetworkError(null)
    setStatus(null)
    setPollingSignal((prev) => prev + 1)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/70 px-4 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_45%)]" />
      <div className="relative z-10 w-full max-w-3xl space-y-8">
        <div className={`rounded-3xl border ${cardBorderClass} bg-card/80 p-8 shadow-2xl backdrop-blur-md md:p-10`}>
          <div className="flex flex-col items-center gap-6 text-center">
            <span className={`relative flex h-16 w-16 items-center justify-center rounded-full ${iconContainerClass}`}>
              {showLoader ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Icon className="h-8 w-8" />
              )}
            </span>
            <div className="space-y-2">
              <h1 className={`text-2xl font-semibold tracking-tight md:text-3xl ${mainTitleClass}`}>
                {mainTitle}
              </h1>
              <p className={subTitleClass}>{subTitle}</p>
            </div>
            <div className="space-y-2">
              <h2 className={`text-xl font-semibold md:text-2xl ${statusToneClass}`}>{headline}</h2>
              <p className={descriptionClass}>{description}</p>
            </div>

            {(networkError || isError) && (
              <div className="w-full rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-left">
                <div className="flex items-start gap-3">
                  {networkError ? (
                    <WifiOff className="h-5 w-5 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold text-destructive">
                      {networkError ? pollerT("networkBannerTitle") : pollerT("errorBannerTitle")}
                    </p>
                    <p className="text-sm text-destructive/90">
                      {networkError
                        ? pollerT("networkBannerDescription")
                        : pollerT("errorBannerDescription", {
                          status: status != null ? statusTitle(status) : pollerT("statusUnknown")
                        })}
                    </p>
                    {networkError && (
                      <p className="break-words text-xs text-destructive/80">{networkError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showLoader && (
              <div className="flex w-full flex-col items-center gap-2">
                <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted/70">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/70" />
                </div>
                {status != null && (
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {statusTitle(status)}
                  </span>
                )}
              </div>
            )}

            {networkError && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleRetry}>{pollerT("retry")}</Button>
                <Button asChild variant="outline">
                  <Link href="/getHelp">{pollerT("contactSupport")}</Link>
                </Button>
              </div>
            )}

            {isError && !networkError && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/getHelp">{pollerT("contactSupport")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard">{pollerT("returnToDashboard")}</Link>
                </Button>
              </div>
            )}

            {isSuccess && (
              <div className="flex w-full flex-col items-center gap-4">
                <p className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  {pollerT("redirecting", { seconds: countdown })}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild>
                    <Link href={encodeURI(`/gameserver/${serverId}?start=true`)}>{pollerT("successButton")}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/getHelp">{pollerT("contactSupport")}</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {featureItems.map(({ icon: FeatureIcon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/50 bg-card/70 p-4 text-left shadow-lg backdrop-blur"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FeatureIcon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

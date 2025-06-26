"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Server, ExternalLink, AlertCircle } from "lucide-react"
import checkIfServerReady from "./checkIfServerReady"
import { OrderStatus } from "@prisma/client";
import { redirect } from "next/navigation"

export default function ServerReadyPoller({ sessionId }: { sessionId: string }) {
  const [serverId, setServerId] = useState<string | null>(null)
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dots, setDots] = useState("")
  const [startTime] = useState(Date.now())

  useEffect(() => {
    if (!loading) return

    async function poll() {
      try {
        const { status, serverId } = await checkIfServerReady(sessionId, true)
        setOrderStatus(status)
        setServerId(serverId)

        if (status === OrderStatus.CREATED || status === OrderStatus.FAILED) {
          const elapsedTime = Date.now() - startTime
          const remainingTime = Math.max(0, 3000 - elapsedTime)

          if (remainingTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingTime))
          }
          setLoading(false)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred")
        setLoading(false)
      }
    }
    poll()

    const interval = setInterval(poll, 1000)

    return () => clearInterval(interval)
  }, [loading, startTime, sessionId])

  // Animate dots for loading state
  useEffect(() => {
    if (!loading) return

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => clearInterval(interval)
  }, [loading])

  const handleConnectToServer = () => {
    redirect(`/gameserver/${serverId}`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto p-8">
        <AnimatePresence mode="wait">
          {error || orderStatus === OrderStatus.FAILED || (orderStatus === null && serverId === null) ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Server Error
                </h2>
                <p className="text-gray-600">{error || (orderStatus === null && serverId === null ? "Server not found or invalid session." : "There was an issue creating your server.")}</p>
              </div>
            </motion.div>
          ) : loading || orderStatus === OrderStatus.PENDING || orderStatus === OrderStatus.PAID ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <Server className="w-8 h-8 text-gray-600" />
                </motion.div>
                <div className="absolute inset-0 w-16 h-16 mx-auto border-2 border-transparent border-t-gray-300 rounded-full animate-spin" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {orderStatus === OrderStatus.PENDING ? "Waiting for Payment" : "Creating Your Server"}
                </h2>
                <p className="text-gray-600">{orderStatus === OrderStatus.PENDING ? "Please complete your payment" : "Creating your server"}{dots}</p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-gray-400 h-1 rounded-full animate-pulse w-1/3" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center"
              >
                <Server className="w-8 h-8 text-green-600" />
              </motion.div>

              <div>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-semibold text-gray-900 mb-2"
                >
                  Server Ready
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 mb-1"
                >
                  Your server is now online
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-gray-500 font-mono"
                >
                  Server ID: {serverId}
                </motion.p>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnectToServer}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <span>Connect to Server</span>
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

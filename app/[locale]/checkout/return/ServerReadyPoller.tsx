"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, AlertCircle, Loader2, CheckCircle, XCircle, Wallet, Server } from "lucide-react"
import checkIfServerReady from "./checkIfServerReady"
import { OrderStatus } from "@prisma/client"
import { redirect } from "next/navigation"

const statusConfig = {
  [OrderStatus.PENDING]: {
    icon: Wallet,
    title: "Waiting for Payment",
    message: "Please complete your payment to proceed.",
    progress: 25,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    iconClass: "",
  },
  [OrderStatus.PAID]: {
    icon: Loader2,
    title: "Server is being created",
    message: "Your server is currently being provisioned.",
    progress: 50,
    color: "text-blue-600",
    bg: "bg-blue-100",
    iconClass: "animate-spin",
  },
  [OrderStatus.CREATED]: {
    icon: Loader2,
    title: "Server is installing",
    message: "The game is being installed on your server.",
    progress: 75,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
    iconClass: "animate-spin",
  },
  [OrderStatus.INSTALLED]: {
    icon: Server,
    title: "Server Ready",
    message: "Your server is now online and ready to connect.",
    progress: 100,
    color: "text-green-600",
    bg: "bg-green-100",
    iconClass: "",
  },
  [OrderStatus.FAILED]: {
    icon: XCircle,
    title: "Server Creation Failed",
    message: "There was a problem creating your server. Please contact support.",
    progress: 0,
    color: "text-red-600",
    bg: "bg-red-100",
    iconClass: "",
  },
}

export default function ServerReadyPoller({ sessionId }: { sessionId: string }) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [serverId, setServerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (orderStatus === OrderStatus.INSTALLED || orderStatus === OrderStatus.FAILED) {
        clearInterval(intervalId)
        return
      }

      checkIfServerReady(sessionId)
        .then(({ status, serverId }) => {
          setOrderStatus(status)
          setServerId(serverId)
          if (loading) setLoading(false)
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "An unknown error occurred")
          setLoading(false)
          clearInterval(intervalId)
        })
    }, 1000) // Poll every second

    return () => clearInterval(intervalId)
  }, [sessionId, orderStatus, loading])

  const handleConnectToServer = () => {
    if (serverId) {
      redirect(`/gameserver/${serverId}`)
    }
  }

  const currentStatus = orderStatus ? statusConfig[orderStatus] : null

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto p-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <Loader2 className="w-16 h-16 mx-auto text-gray-400 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900">
                Checking Status...
              </h2>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className={`w-16 h-16 mx-auto ${statusConfig[OrderStatus.FAILED].bg} rounded-full flex items-center justify-center`}>
                <AlertCircle className={`w-8 h-8 ${statusConfig[OrderStatus.FAILED].color}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {statusConfig[OrderStatus.FAILED].title}
                </h2>
                <p className="text-gray-600">{error}</p>
              </div>
            </motion.div>
          ) : currentStatus ? (
            <motion.div
              key={orderStatus}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <motion.div
                key={`${orderStatus}-icon`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={`w-16 h-16 mx-auto ${currentStatus.bg} rounded-full flex items-center justify-center`}
              >
                <currentStatus.icon className={`w-8 h-8 ${currentStatus.color} ${currentStatus.iconClass}`} />
              </motion.div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentStatus.title}
                </h2>
                <p className="text-gray-600 mb-6">{currentStatus.message}</p>
              </div>

              {(orderStatus !== OrderStatus.INSTALLED && orderStatus !== OrderStatus.FAILED) && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className="bg-blue-600 h-2.5 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${currentStatus.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>)}

              {orderStatus === OrderStatus.INSTALLED && (
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
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

"use client"

interface InfoProps { state: string }


export function Status({ state }: InfoProps) {
  const getStatusColor = () => {
    switch (state?.toLowerCase()) {
      case "running":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      case "starting":
        return "bg-yellow-500"
      case "stopping":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
      <span className="font-medium capitalize">{state}</span>
    </div>
  )
}

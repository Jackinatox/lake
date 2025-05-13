"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface GameCardProps {
  card: {
    id: string | number
    name: string
    fullName: string
  }
  imgPath: string
}

export default function GameCard({ card, imgPath }: GameCardProps) {
  return (
    <Link href={`/booking2/${card.id}`} className="block w-[280px]">
      <Card className="overflow-hidden transition-transform duration-300 hover:scale-[1.075] shadow-lg">
        <div>
          <img src={imgPath || "/placeholder.svg"} alt={card.name} className="w-full h-auto rounded-t-lg" />
        </div>
        <CardContent className="pt-4">
          <h3 className="text-xl font-semibold">{card.name}</h3>
        </CardContent>
      </Card>
    </Link>
  )
}


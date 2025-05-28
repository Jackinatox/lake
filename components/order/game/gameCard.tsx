"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface GameCardProps {
  card: {
    id: string | number
    name: string
  }
  imgPath: string
}

export default function GameCard({ card, imgPath }: GameCardProps) {
  return (
    <Link href={`/booking2/${card.id}`} className="block w-[280px]">
      <Card className="overflow-hidden transition-transform duration-300 hover:scale-[1.075] shadow-lg">
        <div className="relative w-full h-[200px]">
          <Image
            src={imgPath || "/placeholder.svg"}
            alt={card.name}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 768px) 100vw, 280px"
          />
        </div>
        <CardContent className="pt-4">
          <h3 className="text-xl font-semibold">{card.name}</h3>
        </CardContent>
      </Card>
    </Link>
  )
}

export type Games = 'Minecraft' | 'Satisfactory';

interface Game {
    game: Games,
    minCPU: number,
}

interface Minecraft extends Game {
    seed: string
}

interface Satisfactory extends Game {
    
}
type FactorioBranch = 'stable' | 'experimental';
export type FactorioVersion = { version: string; branch: FactorioBranch };

export type FactorioGameData = {
    versions: FactorioVersion[];
    eggId: number;
    dockerImage: string;
};

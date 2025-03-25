export type PerformanceGroup = 'good' | 'better' | 'best';

export interface PTServerConf {
    cpu: number,
    ram: number,
    disk: number,
    allocations: number,
    backup: number,
    performanceGroup: PerformanceGroup
}
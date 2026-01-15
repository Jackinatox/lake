export function formatMilliseconds(ms: number) {
    if (ms < 0) ms = -ms;

    const units = [
        { name: 'd', value: Math.floor(ms / 86400000) },
        { name: 'h', value: Math.floor(ms / 3600000) % 24 },
        { name: 'm', value: Math.floor(ms / 60000) % 60 },
        { name: 's', value: Math.floor(ms / 1000) % 60 },
    ];

    // Find the first non-zero unit
    const firstNonZeroIndex = units.findIndex((u) => u.value !== 0);

    // If all are zero, return "0s"
    if (firstNonZeroIndex === -1) {
        return '0s';
    }

    // Get two consecutive units starting from the first non-zero
    const twoUnits = units.slice(firstNonZeroIndex, firstNonZeroIndex + 2);

    return twoUnits.map((u) => `${u.value}${u.name}`).join(' ');
}

export const formatVCores = (vcores: number) => {
    const opts: Intl.NumberFormatOptions = {
        minimumFractionDigits: vcores % 1 === 0 ? 0 : 1,
        maximumFractionDigits: 1,
    };
    const num = new Intl.NumberFormat('de-DE', opts).format(vcores);
    return `${num} ${Math.abs(vcores - 1) < 1e-9 ? 'vCore' : 'vCores'}`;
};

export default formatVCores;

/**
 * Convert a CPU percent value (e.g. 50) to VCores (e.g. 0.5).
 * Rounds to a single decimal place to match display formatting.
 */
export const percentToVCores = (percent: number) => {
    const v = percent / 100;
    return Math.round(v * 10) / 10;
};

/**
 * Convenience: format a percent value directly as VCores string.
 */
export const formatVCoresFromPercent = (percent: number) => {
    return formatVCores(percentToVCores(percent));
};

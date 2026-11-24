import { Frame, J3_BOUNDS, J5_BOUNDS } from './engine';

/**
 * The hover animations from J3 (six blocks on the baseline) to J5 (six blocks around the whole
 * cloud). A "tween" variant maps progress p (0 = J3, 1 = J5) to a frame; the driver moves p
 * linearly toward 0/1, so any variant can be reversed or interrupted mid-way. A "spring" variant
 * instead simulates each boundary as a spring toward the J3/J5 position.
 */

export type VariantId = 'stretch' | 'stagger' | 'spring' | 'steps' | 'gaps' | 'lead';

interface TweenVariant {
    id: VariantId;
    name: string;
    description: string;
    kind: 'tween';
    frameAt: (p: number) => Frame;
}
interface SpringVariant {
    id: VariantId;
    name: string;
    description: string;
    kind: 'spring';
    /** stiffness/damping for boundary k */
    spring: (k: number) => { stiffness: number; damping: number };
}
export type Variant = TweenVariant | SpringVariant;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const between = (t: number) => J3_BOUNDS.map((j3, k) => lerp(j3, J5_BOUNDS[k], t));

export const VARIANTS: Variant[] = [
    {
        id: 'stretch',
        name: '1 · Stretch',
        description:
            'All six blocks stretch evenly up the cloud at the same time until they cover all of it. The calmest version.',
        kind: 'tween',
        frameAt: (p) => ({ b: between(easeInOut(p)), gap: 0 }),
    },
    {
        id: 'stagger',
        name: '2 · Rubber band',
        description:
            'Red sets off first and the other colors follow one after another, so the band stretches and then catches up.',
        kind: 'tween',
        frameAt: (p) => {
            const D = 0.5;
            return {
                b: J3_BOUNDS.map((j3, k) =>
                    lerp(j3, J5_BOUNDS[k], easeInOut(clamp01((p - (D * k) / 6) / (1 - D)))),
                ),
                gap: 0,
            };
        },
    },
    {
        id: 'spring',
        name: '3 · Springy',
        description:
            'Each color boundary is a small spring: it shoots around the cloud, overshoots a little and settles. Reacts naturally when you hover on and off quickly.',
        kind: 'spring',
        spring: (k) => ({ stiffness: 210 - k * 22, damping: 13 }),
    },
    {
        id: 'steps',
        name: '4 · Pixel steps',
        description:
            'Same movement as Stretch, but in 10 hard steps like an old game health bar filling up.',
        kind: 'tween',
        frameAt: (p) => ({ b: between(Math.round(easeInOut(p) * 10) / 10), gap: 0 }),
    },
    {
        id: 'gaps',
        name: '5 · Break apart',
        description:
            'While climbing, the line breaks into six separate blocks (gaps open), and they close up again once the cloud is covered.',
        kind: 'tween',
        frameAt: (p) => {
            const e = easeInOut(p);
            return { b: between(e), gap: 0.022 * Math.sin(Math.PI * e) };
        },
    },
    {
        id: 'lead',
        name: '6 · Red leads',
        description:
            'Red runs all the way around the cloud on its own first, then the other five colors pour in behind it.',
        kind: 'tween',
        frameAt: (p) => {
            const front = easeInOut(clamp01(p / 0.55));
            const rest = easeInOut(clamp01((p - 0.35) / 0.65));
            return {
                b: J3_BOUNDS.map((j3, k) => lerp(j3, J5_BOUNDS[k], k === 0 ? front : rest)),
                gap: 0,
            };
        },
    },
];

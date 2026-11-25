'use client';

import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef } from 'react';
import {
    Frame,
    J3_BOUNDS,
    J5_BOUNDS,
    LOGO_H,
    LOGO_W,
    PALETTES,
    UMap,
    WORDMARK_MASK_SRC,
    loadUMap,
    paint,
} from './engine';
import { VARIANTS, VariantId } from './variants';

interface Props {
    /** animation variant id (an id, not the object, so server components can render this) */
    variant: VariantId;
    /** palette; defaults to the current site theme */
    mode?: 'light' | 'dark';
    /** ms for a full J3 -> J5 run of the tween variants */
    duration?: number;
    /** fixed progress 0..1 (debug scrubber); disables hover/tap */
    scrub?: number | null;
    /** flip between J3 and J5 on its own */
    autoplay?: boolean;
    className?: string;
}

const between = (t: number) => J3_BOUNDS.map((j3, k) => j3 + (J5_BOUNDS[k] - j3) * t);

/**
 * The Scyed logo with the six-block Pride baseline (J3) that grows around the whole cloud (J5)
 * on hover, or on tap for touch input. The wordmark uses `currentColor`.
 */
export default function PrideLogo({
    variant: variantId,
    mode,
    duration = 800,
    scrub = null,
    autoplay = false,
    className,
}: Props) {
    const variant = VARIANTS.find((v) => v.id === variantId) ?? VARIANTS[0];
    const { resolvedTheme } = useTheme();
    const palette = PALETTES[mode ?? (resolvedTheme === 'dark' ? 'dark' : 'light')];

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mapRef = useRef<UMap | null>(null);
    const bufRef = useRef<ImageData | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef(0);
    const pRef = useRef(0); // tween progress
    const targetRef = useRef(0); // 0 = J3, 1 = J5
    const xRef = useRef<number[]>([...J3_BOUNDS]); // spring positions
    const vRef = useRef<number[]>(J3_BOUNDS.map(() => 0));
    const lastPointer = useRef<string>('mouse');

    // keep the latest props readable from the RAF loop without restarting it
    const live = useRef({ variant, duration, palette, scrub });
    live.current = { variant, duration, palette, scrub };

    const draw = useCallback((frame: Frame) => {
        const map = mapRef.current;
        const ctx = canvasRef.current?.getContext('2d');
        if (!map || !ctx) return;
        bufRef.current ??= ctx.createImageData(LOGO_W, LOGO_H);
        const b = frame.b.slice();
        for (let k = 1; k < 7; k++) b[k] = Math.max(b[k], b[k - 1]); // springs may cross
        b[6] = 1;
        paint(map, { b, gap: frame.gap }, live.current.palette, bufRef.current.data);
        ctx.putImageData(bufRef.current, 0, 0);
    }, []);

    const tick = useCallback(
        (now: number) => {
            const { variant: v, duration: dur, scrub: s } = live.current;
            const dt = Math.min(0.05, (now - lastRef.current) / 1000);
            lastRef.current = now;
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const target = s ?? targetRef.current;
            let settled: boolean;

            if (v.kind === 'tween') {
                if (s !== null || reduce) pRef.current = target;
                else {
                    const step = (dt * 1000) / dur;
                    const p = pRef.current;
                    pRef.current =
                        p < target ? Math.min(target, p + step) : Math.max(target, p - step);
                }
                settled = pRef.current === target;
                draw(v.frameAt(pRef.current));
            } else {
                const goal = between(target);
                const x = xRef.current;
                const vel = vRef.current;
                settled = true;
                for (let k = 0; k < 7; k++) {
                    if (reduce) {
                        x[k] = goal[k];
                        vel[k] = 0;
                        continue;
                    }
                    const { stiffness, damping } = v.spring(k);
                    const sub = 4;
                    const h = dt / sub;
                    for (let i = 0; i < sub; i++) {
                        vel[k] += (-stiffness * (x[k] - goal[k]) - damping * vel[k]) * h;
                        x[k] += vel[k] * h;
                    }
                    if (Math.abs(x[k] - goal[k]) > 1e-4 || Math.abs(vel[k]) > 1e-3) settled = false;
                    else {
                        x[k] = goal[k];
                        vel[k] = 0;
                    }
                }
                draw({ b: x, gap: 0 });
            }
            rafRef.current = settled ? null : requestAnimationFrame(tick);
        },
        [draw],
    );

    const kick = useCallback(() => {
        if (rafRef.current !== null || !mapRef.current) return;
        lastRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
    }, [tick]);

    const setTarget = useCallback(
        (t: number) => {
            targetRef.current = t;
            kick();
        },
        [kick],
    );

    useEffect(() => {
        let alive = true;
        loadUMap().then((m) => {
            if (!alive) return;
            mapRef.current = m;
            kick();
        });
        return () => {
            alive = false;
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [kick]);

    // repaint on palette/variant/scrub changes; reset state when the variant changes
    useEffect(() => {
        kick();
    }, [palette, scrub, kick]);
    useEffect(() => {
        pRef.current = targetRef.current;
        xRef.current = between(targetRef.current);
        vRef.current = J3_BOUNDS.map(() => 0);
        kick();
    }, [variant, kick]);

    useEffect(() => {
        if (!autoplay) return;
        const id = window.setInterval(() => setTarget(targetRef.current ? 0 : 1), duration + 1400);
        return () => window.clearInterval(id);
    }, [autoplay, duration, setTarget]);

    const interactive = scrub === null && !autoplay;

    return (
        <div
            role="img"
            aria-label="Scyed"
            className={cn('relative aspect-[1084/482] select-none touch-manipulation', className)}
            onPointerDown={(e) => (lastPointer.current = e.pointerType)}
            onPointerEnter={(e) => {
                if (interactive && e.pointerType === 'mouse') setTarget(1);
            }}
            onPointerLeave={(e) => {
                if (interactive && e.pointerType === 'mouse') setTarget(0);
            }}
            onClick={() => {
                // touch/pen have no hover: a tap toggles
                if (interactive && lastPointer.current !== 'mouse')
                    setTarget(targetRef.current ? 0 : 1);
            }}
        >
            <canvas
                ref={canvasRef}
                width={LOGO_W}
                height={LOGO_H}
                className="absolute inset-0 h-full w-full"
            />
            <div
                aria-hidden
                className="absolute inset-0 bg-current"
                style={{
                    maskImage: `url(${WORDMARK_MASK_SRC})`,
                    WebkitMaskImage: `url(${WORDMARK_MASK_SRC})`,
                    maskSize: '100% 100%',
                    WebkitMaskSize: '100% 100%',
                }}
            />
        </div>
    );
}

/**
 * Pixel engine for the animated Pride logo.
 *
 * `logo-cloud-umap.png` stores, for every pixel of the logo's cloud stroke, how far along the
 * stroke it lies: u = 0 at the swoosh tip, u = 1 at the right end of the baseline. The PNG is
 * fully opaque (R/G = u as 16 bit, B = coverage) so the browser's alpha premultiplication can't
 * destroy the values. Coloring a frame is then a threshold per pixel against 7 boundaries.
 */

export const LOGO_W = 1084;
export const LOGO_H = 482;
export const UMAP_SRC = '/images/pride/logo-cloud-umap.png';
export const WORDMARK_MASK_SRC = '/images/pride/logo-wordmark-mask.png';

/** u where the straight baseline starts (below the S). J3 = six blocks on [U_BASE, 1]. */
export const U_BASE = 0.625;

type RGB = readonly [number, number, number];
export const BRAND_BLUE: RGB = [0, 126, 252];
export const PALETTES: Record<'light' | 'dark', readonly RGB[]> = {
    // light: darker yellow so it shows on white
    light: [
        [228, 3, 3],
        [255, 140, 0],
        [245, 200, 0],
        [0, 128, 38],
        [0, 77, 255],
        [117, 7, 135],
    ],
    // dark: brighter blue/violet so they show on black
    dark: [
        [242, 48, 48],
        [255, 140, 0],
        [255, 237, 0],
        [22, 163, 74],
        [59, 123, 255],
        [155, 63, 209],
    ],
};

/**
 * One frame of the logo: 7 boundaries in u (b[0] = where the colors start, b[6] = 1).
 * Below b[0] the stroke is brand blue. `gap` cuts a transparent gap of that many u-units
 * at the end of segments 0..4.
 */
export interface Frame {
    b: number[];
    gap: number;
}

export const J3_BOUNDS = Array.from({ length: 7 }, (_, k) => U_BASE + ((1 - U_BASE) * k) / 6);
export const J5_BOUNDS = Array.from({ length: 7 }, (_, k) => k / 6);

export interface UMap {
    /** pixel offsets (index into a LOGO_W*LOGO_H buffer) that belong to the cloud */
    pix: Uint32Array;
    u: Float32Array;
    alpha: Uint8Array;
}

let umapPromise: Promise<UMap> | null = null;

export function loadUMap(): Promise<UMap> {
    umapPromise ??= new Promise<UMap>((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = LOGO_W;
            c.height = LOGO_H;
            const ctx = c.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error('no 2d context'));
            ctx.drawImage(img, 0, 0);
            const d = ctx.getImageData(0, 0, LOGO_W, LOGO_H).data;
            let n = 0;
            for (let i = 0; i < LOGO_W * LOGO_H; i++) if (d[i * 4 + 2] > 0) n++;
            const pix = new Uint32Array(n);
            const u = new Float32Array(n);
            const alpha = new Uint8Array(n);
            let j = 0;
            for (let i = 0; i < LOGO_W * LOGO_H; i++) {
                const a = d[i * 4 + 2];
                if (a === 0) continue;
                pix[j] = i;
                u[j] = (d[i * 4] * 256 + d[i * 4 + 1]) / 65535;
                alpha[j] = a;
                j++;
            }
            resolve({ pix, u, alpha });
        };
        img.onerror = () => {
            umapPromise = null;
            reject(new Error('failed to load ' + UMAP_SRC));
        };
        img.src = UMAP_SRC;
    });
    return umapPromise;
}

/** Writes the cloud pixels of `frame` into `out` (a LOGO_W*LOGO_H RGBA buffer). */
export function paint(map: UMap, frame: Frame, palette: readonly RGB[], out: Uint8ClampedArray) {
    const { pix, u, alpha } = map;
    const b = frame.b;
    const gap = frame.gap;
    for (let j = 0; j < pix.length; j++) {
        const v = u[j];
        const o = pix[j] * 4;
        let c: RGB = BRAND_BLUE;
        let a = alpha[j];
        if (v >= b[0]) {
            let k = 5;
            for (let s = 1; s < 6; s++) {
                if (v < b[s]) {
                    k = s - 1;
                    break;
                }
            }
            c = palette[k];
            if (gap > 0 && k < 5 && v >= b[k + 1] - gap) a = 0;
        }
        out[o] = c[0];
        out[o + 1] = c[1];
        out[o + 2] = c[2];
        out[o + 3] = a;
    }
}

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedRevealProps {
    /** Whether the content is visible */
    show: boolean;
    children: ReactNode;
}

/**
 * Smoothly reveals or hides its children with a combined height + fade animation.
 *
 * Used for config fields that should only appear when a related toggle is on
 * (e.g. the ModPack field when Modded is enabled, or the Server Name field
 * when Public Server is enabled). `initial={false}` keeps already-visible
 * fields from animating on first mount — only toggling animates.
 *
 * Spacing note: the parent list uses Tailwind `space-y-*`, which adds the
 * inter-item gap as a `margin-block-end` *outside* this wrapper. That margin
 * isn't part of the height animation, so on exit it would linger until the
 * node unmounts and then snap away. We zero out that external margin and
 * recreate the gap as inner bottom padding (`pb-*`, matching the list's
 * `space-y-4 md:space-y-6`) so it collapses together with the height.
 * Assumes the revealed item is never the last child of the list.
 */
export function AnimatedReveal({ show, children }: AnimatedRevealProps) {
    return (
        <AnimatePresence initial={false}>
            {show && (
                <motion.div
                    key="reveal"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
                    style={{ marginBlockEnd: 0 }}
                    className="overflow-hidden"
                >
                    <div className="pb-4 md:pb-6">{children}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

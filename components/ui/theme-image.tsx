import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface ThemeImageProps extends Omit<ImageProps, 'src' | 'className'> {
    src: string;
    alt: string;
    className?: string;
    lightClassName?: string;
    darkClassName?: string;
}

function normalizeThemedImageSrc(src: string) {
    const normalizedSrc = src.startsWith('/images/') ? src : `/images/${src.replace(/^\/+/, '')}`;

    if (normalizedSrc.startsWith('/images/light/')) {
        return normalizedSrc.replace('/images/light/', '/images/');
    }

    if (normalizedSrc.startsWith('/images/dark/')) {
        return normalizedSrc.replace('/images/dark/', '/images/');
    }

    return normalizedSrc;
}

function getThemedImageSrc(src: string, theme: 'light' | 'dark') {
    return normalizeThemedImageSrc(src).replace('/images/', `/images/${theme}/`);
}

/**
 * This component renders two Image components, one for light mode and one for dark mode, and uses CSS classes to show/hide them based on the current theme. It also normalizes the image source path to ensure it works correctly regardless of how it's provided.
 *
 * @param {string} src - The source path of the image, which can be provided in various formats (e.g., 'game.webp', '/images/game.webp', '/images/light/game.webp').
 * @param {string} alt - The alt text for the image.
 * @param {string} [className] - Optional additional class names to apply to both images.
 * @param {string} [lightClassName] - Optional additional class names to apply only to the light mode image.
 * @param {string} [darkClassName] - Optional additional class names to apply only to the dark mode image.
 * @param {object} [props] - Additional props to pass to the Image components (e.g., width, height, layout).
 * @returns {JSX.Element} The themed image component.
 */

export function ThemeImage({
    src,
    alt,
    className,
    lightClassName,
    darkClassName,
    ...props
}: ThemeImageProps) {
    return (
        <>
            <Image
                {...props}
                src={getThemedImageSrc(src, 'light')}
                alt={alt}
                className={cn(className, lightClassName, 'dark:hidden')}
            />
            <Image
                {...props}
                src={getThemedImageSrc(src, 'dark')}
                alt={alt}
                className={cn('hidden dark:block', className, darkClassName)}
            />
        </>
    );
}

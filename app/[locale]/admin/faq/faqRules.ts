/** Checks shared by the FAQ dialog (to block saving) and the createFAQ/editFAQ server actions. */

/** `sorting` is an INTEGER column; small whole numbers are plenty and a typo cannot overflow it. */
export const FAQ_SORTING_MAX = 9999;

export function isValidFaqSorting(sorting: number): boolean {
    return Number.isInteger(sorting) && sorting >= 0 && sorting <= FAQ_SORTING_MAX;
}

export const FAQ_SORTING_ERROR = `Sort order must be a whole number from 0 to ${FAQ_SORTING_MAX}`;

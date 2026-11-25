/** Static exports of the earlier logo concepts from the design rounds, for review. */
export interface Concept {
    slug: string;
    round: string;
    title: string;
    description: string;
    width: number;
    height: number;
}

export const CONCEPTS: Concept[] = [
    {
        slug: 'e-a',
        round: 'Round 2 · Flag in the E',
        title: 'A · Split bars',
        description:
            'Each bar of the E carries two flag stripes: red/orange, yellow/green, blue/violet. The bars keep their shape, so the E reads exactly as before; the six colors run top to bottom in flag order.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'e-b',
        round: 'Round 2 · Flag in the E',
        title: 'B · Six lines',
        description:
            'Same as A, with a thin cut through each bar, so the E turns into six separate stripes. Closer to the flag itself; the cut closes up at navbar size.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'e-c',
        round: 'Round 2 · Flag in the E',
        title: 'C · Six bars',
        description:
            'The E is redrawn as six thinner bars in the same space, one per color. The most literal flag; the letter becomes a little less of an E.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'e-d',
        round: 'Round 2 · Flag in the E',
        title: 'D · Columns',
        description:
            'The flag turned sideways: every bar shows all six colors left to right in hard blocks. Looks more like a pattern than a flag.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'e-e',
        round: 'Round 2 · Flag in the E',
        title: 'E · Progress Pride',
        description:
            'The intersex-inclusive Progress Pride flag: split rainbow bars plus the chevron coming in from the left (black, brown, light blue, pink, white, yellow with the purple intersex circle). Everything is cut to the shape of the E. In light mode the white stripe disappears against the white page, and in dark mode the black one does.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'cloud-f',
        round: 'Round 3 · Cloud & baseline',
        title: 'F · Rainbow cloud',
        description:
            'The cloud stroke turns into a rainbow arc: six solid bands that follow the curve, red on the outside and violet on the inside. Clouds and rainbows go together anyway, and the wordmark stays exactly as it is.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'cloud-g',
        round: 'Round 3 · Cloud & baseline',
        title: 'G · Silver lining',
        description:
            'The outer half of the stroke stays brand blue and the inner half becomes six thin stripes. From far away it is your blue cloud; up close the inside is a rainbow.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'cloud-h',
        round: 'Round 3 · Cloud & baseline',
        title: 'H · Rainbow tip',
        description:
            'Only the swoosh at the top, the most dynamic part of the logo, carries the six bands, with a hard cut where it leaves the blue body.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'cloud-i',
        round: 'Round 3 · Cloud & baseline',
        title: 'I · Ribbon baseline',
        description:
            'The cloud stays fully blue. Where the line straightens out under the wordmark it turns into a six-stripe ribbon, like the flag laid flat.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'cloud-j',
        round: 'Round 3 · Cloud & baseline',
        title: 'J · Pixel segments',
        description:
            'The end of the baseline breaks into six separate blocks, one per color, like a health bar or loading bar. A small nod to the gaming side.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'cloud-k',
        round: 'Round 3 · Cloud & baseline',
        title: 'K · Ribbon + Split E',
        description:
            'The ribbon baseline (I) together with the split-bar E (A from before): the flag shows up twice, once in the logo mark and once in the lettering. Probably the upper limit before it stops being subtle.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'seg-j1',
        round: 'Round 4 · Bigger segments',
        title: 'J1 · Full line',
        description:
            'The whole straight part of the baseline becomes the six blocks, each about 80 px wide in the master file. The cloud curve stays blue and flows straight into red.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'seg-j2',
        round: 'Round 4 · Bigger segments',
        title: 'J2 · Full line, bold',
        description:
            'Same as J1, with the line about 60% thicker (it grows upward, into the empty space under the wordmark). The colors hold up best at small sizes here.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'seg-j3',
        round: 'Round 4 · Bigger segments',
        title: 'J3 · Full line, no gaps',
        description:
            'J1 without the gaps: one continuous line made of six solid blocks. Calmer, closer to a flag; loses the "health bar" feel.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'seg-j4',
        round: 'Round 4 · Bigger segments',
        title: 'J4 · Full width',
        description:
            'The line is extended to end under the D, so it spans the whole wordmark and every block gets wider. Changes the logo’s outline slightly.',
        width: 1084,
        height: 493,
    },
    {
        slug: 'seg-j5',
        round: 'Round 4 · Bigger segments',
        title: 'J5 · Whole cloud',
        description:
            'The entire stroke, cloud included, is cut into six segments: red at the tip, around the cloud, to violet at the end of the line. Reads top to bottom like the flag.',
        width: 1084,
        height: 493,
    },
];

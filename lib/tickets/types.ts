/**
 * Error codes returned by ticket actions. Customer pages map them to `supportTickets.errors.*`
 * translations, so every code needs a key in `messages/{en,de}.json`.
 */
export type TicketActionError =
    | 'unauthorized'
    | 'invalid'
    | 'notFound'
    | 'closed'
    | 'serverNotFound'
    | 'openLimit'
    | 'dailyLimit'
    | 'messageLimit'
    | 'conflict'
    | 'unknown';

export type TicketActionResult<T extends object = object> =
    ({ success: true } & T) | { success: false; error: TicketActionError; message?: string };

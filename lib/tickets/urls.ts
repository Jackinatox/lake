export function customerTicketUrl(ticketId: string) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/support/tickets/${ticketId}`;
}

export function adminTicketUrl(ticketNumber: number) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/admin/support/${ticketNumber}`;
}

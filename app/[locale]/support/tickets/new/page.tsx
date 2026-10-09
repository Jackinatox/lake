import type { TicketCategory } from '@/app/client/generated/enums';
import { getUserServer } from '@/app/data-access-layer/clientServers/getUsersServer';
import { listCustomerTickets } from '@/app/data-access-layer/tickets/customerTickets';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { getActiveSuspension } from '@/lib/gameserver/suspension';
import { TICKET_CATEGORIES, TICKET_SUBJECT_MAX_LENGTH } from '@/lib/tickets/constants';
import { headers } from 'next/headers';
import NewTicketForm, { type TicketServerOption } from './NewTicketForm';

type SearchParams = { category?: string; subject?: string; server?: string };

export default async function NewTicketPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const [query, session] = await Promise.all([
        searchParams,
        auth.api.getSession({ headers: await headers() }),
    ]);

    if (!session) {
        return <NotLoggedIn />;
    }

    const [servers, tickets] = await Promise.all([
        getUserServer(session.user.id),
        listCustomerTickets(session.user.id),
    ]);

    const serverOptions: TicketServerOption[] = servers.map((server) => ({
        id: server.id,
        name: server.name,
        gameName: server.gameData.name,
        suspended: Boolean(getActiveSuspension(server)),
    }));

    const requestedCategory = query.category?.toUpperCase() as TicketCategory | undefined;
    const category =
        requestedCategory && TICKET_CATEGORIES.includes(requestedCategory)
            ? requestedCategory
            : 'GENERAL';

    // `?server=` carries the id from the dashboard URL (the Pterodactyl identifier). Without it,
    // a suspension ticket preselects the user's suspended server when there is exactly one.
    const suspendedServers = serverOptions.filter((server) => server.suspended);
    const preselectedServerId =
        servers.find((server) => query.server && server.ptServerId === query.server)?.id ??
        (category === 'SUSPENSION' && suspendedServers.length === 1
            ? suspendedServers[0].id
            : undefined);

    const openTickets = tickets
        .filter((ticket) => ticket.status !== 'CLOSED')
        .map((ticket) => ({
            id: ticket.id,
            number: ticket.number,
            subject: ticket.subject,
            category: ticket.category,
        }));

    return (
        <NewTicketForm
            defaultCategory={category}
            defaultSubject={query.subject?.slice(0, TICKET_SUBJECT_MAX_LENGTH) ?? ''}
            defaultServerId={preselectedServerId}
            servers={serverOptions}
            openTickets={openTickets}
        />
    );
}

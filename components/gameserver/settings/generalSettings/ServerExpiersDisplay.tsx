import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import formatDate from '@/lib/formatDate';
import { ArrowUpCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ServerExpiersDisplayProps {
    ptServerId: string;
    expiryDate: Date;
}

function ServerExpiersDisplay({ ptServerId, expiryDate }: ServerExpiersDisplayProps) {
    const now = new Date();
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = diffDays < 0;
    const isExpiringSoon = !isExpired && diffDays <= 7;

    const formattedDate = formatDate(expiryDate, true);

    const badgeClass = isExpired
        ? 'border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
        : isExpiringSoon
          ? 'border-transparent bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
          : 'border-transparent bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';

    const badgeLabel = isExpired
        ? 'Expired'
        : isExpiringSoon
          ? `${diffDays}d left`
          : `${diffDays}d left`;

    return (
        <div>
            <Label>Server Expiry</Label>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1.5 rounded-md border px-1.5 py-1.5">
                <div className="flex items-center justify-between gap-2 min-w-0 sm:justify-start">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground truncate">{formattedDate}</span>
                    </div>
                    <Badge className={badgeClass}>{badgeLabel}</Badge>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full sm:w-auto shrink-0 gap-1.5"
                >
                    <Link href={`/gameserver/${ptServerId}/upgrade`}>
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                        Upgrade
                    </Link>
                </Button>
            </div>
        </div>
    );
}

export default ServerExpiersDisplay;

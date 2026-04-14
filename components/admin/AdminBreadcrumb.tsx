import Link from 'next/link';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Shield } from 'lucide-react';

export type Crumb = {
    label: string;
    href?: string;
};

export default function AdminBreadcrumb({ items }: { items: Crumb[] }) {
    return (
        <div className="md:mb-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link
                                href="/admin"
                                className="flex items-center gap-1.5 text-muted-foreground"
                            >
                                <Shield className="h-3.5 w-3.5" />
                                Admin
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {items.map((item, i) => (
                        <span key={i} className="contents">
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {item.href ? (
                                    <BreadcrumbLink asChild>
                                        <Link href={item.href}>{item.label}</Link>
                                    </BreadcrumbLink>
                                ) : (
                                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                )}
                            </BreadcrumbItem>
                        </span>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
}

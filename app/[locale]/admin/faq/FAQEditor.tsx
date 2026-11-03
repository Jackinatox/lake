'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { FAQ } from '@/app/client/generated/browser';
import FAQEditDialog from './FAQEditDialog';
import DeleteFAQButton from './DeleteFAQButton';

interface FAQEditorProps {
    faqs: FAQ[];
    categories: string[];
}

export default function FAQEditor({ faqs, categories }: FAQEditorProps) {
    const router = useRouter();
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [creating, setCreating] = useState(false);

    const filtered =
        categoryFilter === 'all'
            ? faqs
            : faqs.filter((faq) => faq.category.includes(categoryFilter));

    return (
        <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">FAQ Administration</h1>
                <div className="flex items-center gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setCreating(true)}>
                        <Plus className="mr-1 h-4 w-4" />
                        New FAQ
                    </Button>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">ID</TableHead>
                        <TableHead>Question (DE)</TableHead>
                        <TableHead>Categories</TableHead>
                        <TableHead className="w-20">Enabled</TableHead>
                        <TableHead className="w-20">Sort</TableHead>
                        <TableHead className="w-28" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.map((faq) => (
                        <TableRow key={faq.id}>
                            <TableCell className="text-muted-foreground">{faq.id}</TableCell>
                            <TableCell className="max-w-xs truncate">{faq.question_de}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {faq.category.join(', ')}
                            </TableCell>
                            <TableCell>{faq.enabled ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{faq.sorting}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setEditingFaq(faq)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <DeleteFAQButton faq={faq} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {editingFaq && (
                <FAQEditDialog
                    key={editingFaq.id}
                    faq={editingFaq}
                    categories={categories}
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setEditingFaq(null);
                    }}
                    onSaved={() => router.refresh()}
                />
            )}

            {creating && (
                <FAQEditDialog
                    key="new"
                    categories={categories}
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setCreating(false);
                    }}
                    onSaved={() => router.refresh()}
                />
            )}
        </div>
    );
}

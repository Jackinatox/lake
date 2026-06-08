'use client';

import { useState, useTransition, useMemo } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { FAQ } from '@/app/client/generated/browser';
import editFAQ from './editFaq';

// ─── Category multi-select combobox ──────────────────────────────────────────

function CategoryCombobox({
    allCategories,
    selected,
    onSelectedChange,
}: {
    allCategories: string[];
    selected: string[];
    onSelectedChange: (v: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState(allCategories);
    const [input, setInput] = useState('');

    const optionsLower = useMemo(() => new Set(options.map((c) => c.toLowerCase())), [options]);
    const filtered = useMemo(
        () => options.filter((c) => c.toLowerCase().includes(input.toLowerCase())),
        [options, input],
    );
    const showCreate = input.trim().length > 0 && !optionsLower.has(input.trim().toLowerCase());

    function toggle(cat: string) {
        onSelectedChange(
            selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat],
        );
    }

    function create(cat: string) {
        const trimmed = cat.trim();
        if (!trimmed) return;
        setOptions((prev) => [...prev, trimmed]);
        onSelectedChange([...selected, trimmed]);
        setInput('');
    }

    const label =
        selected.length === 0
            ? null
            : selected.length === 1
              ? selected[0]
              : `${selected.length} selected`;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {label ?? <span className="text-muted-foreground">Select or create…</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search or create category…"
                        value={input}
                        onValueChange={setInput}
                    />
                    <CommandList>
                        <CommandEmpty>{input ? null : 'No categories yet.'}</CommandEmpty>
                        {filtered.length > 0 && (
                            <CommandGroup heading="Categories">
                                {filtered.map((cat) => (
                                    <CommandItem key={cat} value={cat} onSelect={() => toggle(cat)}>
                                        <Check
                                            className={`mr-2 h-4 w-4 ${selected.includes(cat) ? 'opacity-100' : 'opacity-0'}`}
                                        />
                                        {cat}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        {showCreate && (
                            <CommandGroup heading="Create">
                                <CommandItem
                                    value={`__create__${input}`}
                                    onSelect={() => create(input)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create &quot;{input.trim()}&quot;
                                </CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface FAQEditDialogProps {
    faq: FAQ;
    categories: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export default function FAQEditDialog({ faq, categories, open, onOpenChange, onSaved }: FAQEditDialogProps) {
    const [questionDe, setQuestionDe] = useState(faq.question_de);
    const [questionEn, setQuestionEn] = useState(faq.question_en);
    const [answerDe, setAnswerDe] = useState(faq.answer_de);
    const [answerEn, setAnswerEn] = useState(faq.answer_en);
    const [enabled, setEnabled] = useState(faq.enabled);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(faq.category);
    const [sorting, setSorting] = useState(faq.sorting);
    const [isPending, startTransition] = useTransition();

    function handleSave() {
        startTransition(async () => {
            await editFAQ(faq.id, questionEn, questionDe, answerEn, answerDe, enabled, selectedCategories, sorting);
            onSaved();
            onOpenChange(false);
        });
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit FAQ #{faq.id}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="de">
                    <TabsList>
                        <TabsTrigger value="de">Deutsch</TabsTrigger>
                        <TabsTrigger value="en">English</TabsTrigger>
                    </TabsList>

                    <TabsContent value="de" className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label>Question</Label>
                            <Input value={questionDe} onChange={(e) => setQuestionDe(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Answer</Label>
                            <Textarea rows={6} value={answerDe} onChange={(e) => setAnswerDe(e.target.value)} />
                        </div>
                    </TabsContent>

                    <TabsContent value="en" className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label>Question</Label>
                            <Input value={questionEn} onChange={(e) => setQuestionEn(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Answer</Label>
                            <Textarea rows={6} value={answerEn} onChange={(e) => setAnswerEn(e.target.value)} />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1.5">
                        <Label>Categories</Label>
                        <CategoryCombobox
                            allCategories={categories}
                            selected={selectedCategories}
                            onSelectedChange={setSelectedCategories}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="enabled">Enabled</Label>
                            <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sorting">Sort order</Label>
                            <Input
                                id="sorting"
                                type="number"
                                value={sorting}
                                onChange={(e) => setSorting(Number(e.target.value))}
                                className="w-24"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import React, { useState, useTransition } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createUserAsAdmin } from '@/app/actions/users/adminUsers';
import { AUTH_PASSWORD_MAX_LENGTH, AUTH_PASSWORD_MIN_LENGTH } from '@/lib/validation/auth';

interface CreateUserDialogProps {
    onCreated: () => void;
}

const emptyForm = { email: '', name: '', password: '', emailVerified: true };

export default function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) {
            setForm(emptyForm);
            setError(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const result = await createUserAsAdmin({
                email: form.email,
                name: form.name || undefined,
                password: form.password,
                emailVerified: form.emailVerified,
            });
            if (!result.success) {
                setError(result.error);
                // The user exists even if only the verification email failed
                onCreated();
                return;
            }
            toast({
                title: 'User created',
                description: form.emailVerified
                    ? `${form.email} can log in now.`
                    : `Verification email sent to ${form.email}.`,
            });
            onCreated();
            handleOpenChange(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="lg">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Create User</DialogTitle>
                        <DialogDescription>
                            Creates an email/password account. The user logs in with the email and
                            the password set here. Anyone who later signs in with Google or Discord
                            using this email gets access to this account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="create-user-email">Email</Label>
                        <Input
                            id="create-user-email"
                            type="email"
                            required
                            autoComplete="off"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="create-user-name">Name (optional)</Label>
                        <Input
                            id="create-user-name"
                            autoComplete="off"
                            placeholder="Defaults to the part before the @"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="create-user-password">Password</Label>
                        <Input
                            id="create-user-password"
                            type="password"
                            required
                            autoComplete="new-password"
                            minLength={AUTH_PASSWORD_MIN_LENGTH}
                            maxLength={AUTH_PASSWORD_MAX_LENGTH}
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        />
                    </div>
                    <div className="flex items-start justify-between gap-4 rounded-md border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="create-user-verified">Email already verified</Label>
                            <p className="text-xs text-muted-foreground">
                                {form.emailVerified
                                    ? 'The user can log in right away.'
                                    : 'A verification email is sent; login works after confirming.'}
                            </p>
                        </div>
                        <Switch
                            id="create-user-verified"
                            checked={form.emailVerified}
                            onCheckedChange={(checked) =>
                                setForm((f) => ({ ...f, emailVerified: checked }))
                            }
                        />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

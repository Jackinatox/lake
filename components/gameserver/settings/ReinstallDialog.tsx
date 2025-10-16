import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { env } from 'next-runtime-env';
import { RefreshCw } from "lucide-react";
import ReinstallPTUserServer from "@/lib/Pterodactyl/Functions/ReinstallPTUserServer";

const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');

interface ReinstallDialogProps {
    apiKey: string;
    server_id: string;
}

const ReinstallDialog = ({ apiKey, server_id }: ReinstallDialogProps) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleReinstall = async () => {
        setIsLoading(true);
        const response = await ReinstallPTUserServer(server_id, apiKey);

        if (!response.ok) {
            console.error("Failed to reinstall server:", response.statusText);
        }

        setIsLoading(false);
        setOpen(false);
    };

    return (
        <>
            <Button variant="destructive" onClick={() => setOpen(true)} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reinstall Server
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reinstall Server?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reinstall your server? This will reinstall the server software. All data will be preserved.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isLoading}>Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleReinstall} disabled={isLoading}>
                            {isLoading ? "Reinstalling..." : "Reinstall"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ReinstallDialog;
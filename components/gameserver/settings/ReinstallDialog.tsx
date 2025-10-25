import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import ReinstallPTUserServer from "@/lib/Pterodactyl/Functions/ReinstallPTUserServer";

interface ReinstallDialogProps {
    apiKey: string;
    server_id: string;
}

const ReinstallDialog = ({ apiKey, server_id }: ReinstallDialogProps) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteAllFiles, setDeleteAllFiles] = useState(false);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            setDeleteAllFiles(false);
        }
    };

    const handleReinstall = async () => {
        setIsLoading(true);
        const response = await ReinstallPTUserServer(server_id, apiKey, deleteAllFiles);

        if (!response.ok) {
            console.error("Failed to reinstall server:", response.statusText);
        }

        setIsLoading(false);
        setOpen(false);
        setDeleteAllFiles(false);
    };

    return (
        <>
            <Button variant="destructive" onClick={() => setOpen(true)} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reinstall Server
            </Button>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reinstall Server?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reinstall your server? This will reinstall the server software. All data will be preserved unless you choose to delete all files below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2 pt-4">
                        <Checkbox
                            id="delete-all-files"
                            checked={deleteAllFiles}
                            onCheckedChange={(checked) => setDeleteAllFiles(checked === true)}
                            disabled={isLoading}
                        />
                        <Label htmlFor="delete-all-files" className="text-sm font-normal">
                            Delete all files before reinstalling
                        </Label>
                    </div>
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
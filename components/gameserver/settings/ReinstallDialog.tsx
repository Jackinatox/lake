import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReinstallDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isLoading?: boolean;
}

const handleReinstall = async () => {
    
}

const ReinstallDialog: React.FC<ReinstallDialogProps> = ({ open, onOpenChange, isLoading }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
    );
};

export default ReinstallDialog;
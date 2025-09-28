import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const ReinstallDialog: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleReinstall = async () => {
        setIsLoading(true);
        // Add reinstall logic here
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
        setOpen(false);
    };

    return (
        <>
            <Button variant="destructive" onClick={() => setOpen(true)} className="w-full sm:w-auto">
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
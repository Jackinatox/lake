import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Button } from '../ui/button';
import Link from 'next/link';

interface EulaDialogProps {
    isOpen: boolean;
    onAcceptEula: () => void;
    setOpen: (open: boolean) => void;
}

function EulaDialog({ isOpen, onAcceptEula, setOpen }: EulaDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={() => { setOpen(false) }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Accept Minecraft® EULA</DialogTitle>
                    <DialogDescription>
                        By pressing "I Accept" below you are indicating your agreement to the 
                        <Link href='https://www.minecraft.net/de-de/eula' target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"> Minecraft® EULA.</Link>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { setOpen(false) }}>Cancel</Button>
                    <Button onClick={() => { onAcceptEula(); setOpen(false); }}>Accept Eula</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default EulaDialog
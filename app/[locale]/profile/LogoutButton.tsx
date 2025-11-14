'use client';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { LogOut } from 'lucide-react';
import React, { useCallback } from 'react';

function LogoutButton() {
    const handleLogout = useCallback(async () => {
        await authClient.signOut();
        window.location.reload();
    }, []);

    return (
        <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
        </Button>
    );
}

export default LogoutButton;

"use client"

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar'
import { Mail, Shield, User, Lock } from 'lucide-react'
import React from 'react'
import LogoutButton from './LogoutButton'
import { authClient } from '@/lib/auth-client'
import { useTranslations } from 'next-intl'

function ProfileInfo() {
    const session = authClient.useSession();
    const t = useTranslations("payments");

    if (session.isPending) {
        return <div>Loading...</div>;
    }

    const user = session?.data?.user;
    const method = authClient.getLastUsedLoginMethod();
    const wasEmail = authClient.isLastUsedLoginMethod("email");
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{t("profileTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage
                            src={user?.image || undefined}
                            alt="Profile"
                        />
                        <AvatarFallback>PB</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{user?.name ?? ""}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm text-muted-foreground">
                                {user?.email}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm text-muted-foreground">
                                <div>{t("loggedInVia")}: {method.charAt(0).toUpperCase() + method.slice(1)}</div>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" disabled={!wasEmail}>
                        <Lock className="h-4 w-4 mr-2" />
                        {t("changePassword")}
                    </Button>
                    <LogoutButton />
                </div>
            </CardContent>
        </Card>
    )
}

export default ProfileInfo
"use client"

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Mail, Shield, User, Lock } from 'lucide-react'
import React from 'react'
import LogoutButton from './LogoutButton'
import { authClient } from '@/lib/auth-client'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
                                <div>{t("loggedInVia")}:
                                    {method ?
                                        method.charAt(0).toUpperCase() + method.slice(1) :
                                        'Error Loading Login Provider'
                                    }
                                </div>
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
                {!wasEmail && (
                    <span className="relative group">
                        <p className="text-muted-foreground text-sm cursor-help underline decoration-dotted pt-2">
                            {method ? `${t("oauthPasswordChangeNotice1")} ${method.charAt(0).toUpperCase() + method.slice(1)} ${t("oauthPasswordChangeNotice2")}` :
                                'Error loading Login provider'
                            }
                        </p>
                        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded bg-background px-3 py-2 text-xs text-foreground shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                            {t("oauthPasswordChangeTooltip")}
                        </span>
                    </span>
                )}
            </CardContent>
        </Card>
    )
}

export default ProfileInfo
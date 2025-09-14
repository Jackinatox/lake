import { auth } from "@/auth";
import NotLoggedIn from "@/components/auth/NoAuthMessage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Shield, User } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";
import LogoutButton from "./LogoutButton";
import PaymentList from "./payments/PaymentList";
import { prisma } from "@/prisma";
import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            accounts: true,
        }
    });

    const t = await getTranslations("payments");

    return (
        <div className="min-h-screen bg-background md:p-6">
            <div className="mx-auto max-w-2xl space-y-6">
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl">{t("profileTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage
                                    src={user.image || undefined}
                                    alt="Profile"
                                />
                                <AvatarFallback>PB</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">{session.user.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span className="text-sm text-muted-foreground">
                                        {session.user.email}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    <span className="text-sm text-muted-foreground">
                                        {t("loggedInViaOauth")}
                                        {/* TODO: Display OAUTH provider name */}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" disabled>
                                <Lock className="h-4 w-4 mr-2" />
                                {t("changePassword")}
                            </Button>
                            <LogoutButton />
                        </div>
                    </CardContent>
                </Card>

                <Suspense fallback={<div>{t("loadingPayments")}</div>}>
                    <PaymentList />
                </Suspense>
            </div>
        </div>
    );
}

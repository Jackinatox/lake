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
import ProfileInfo from "./profile-info";

export default async function ProfilePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    const wasEmail = session.user.lastLoginMethod === "email";

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
                <ProfileInfo />

                <Suspense fallback={<div>{t("loadingPayments")}</div>}>
                    <PaymentList />
                </Suspense>
            </div>
        </div>
    );
}

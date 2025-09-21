import { auth } from "@/auth";
import NotLoggedIn from "@/components/auth/NoAuthMessage";
import { prisma } from "@/prisma";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { Suspense } from "react";
import PaymentList from "./payments/PaymentList";
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

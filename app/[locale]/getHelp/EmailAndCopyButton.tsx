"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { env } from "next-runtime-env";


export default function EmailAndCopyButton() {
    const SUPPORT_EMAIL = env("NEXT_PUBLIC_SUPPORT_MAIL")!;
    const t = useTranslations("getHelp");
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(SUPPORT_EMAIL);
            toast({ title: t("copyEmailSuccess"), description: SUPPORT_EMAIL });
        } catch (error) {
            toast({ title: t("copyEmailError"), variant: "destructive" });
        }
    };

    const openMailClient = () => {
        window.location.href = `mailto:${SUPPORT_EMAIL}`;
    };

    return (
        <Card className="flex-1 rounded-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    {t("writeEmail")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                    {t("writeEmailTo")} {" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary underline">
                        {SUPPORT_EMAIL}
                    </a>{" "}
                    {t("weWillAnswer")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button onClick={openMailClient} className="gap-2">
                        <Mail className="h-4 w-4" />
                        {t("openMail")}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
                        <Copy className="h-4 w-4" />
                        {t("copyEmail")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
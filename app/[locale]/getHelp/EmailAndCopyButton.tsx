"use client";

import { Mail, Copy, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

const SUPPORT_EMAIL = "support@scyed.com";

export default function EmailAndCopyButton() {
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
                    <Sparkles className="h-4 w-4 text-primary" />
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
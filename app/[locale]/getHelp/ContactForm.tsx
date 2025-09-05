"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function ContactForm() {
    const toast = useToast();
    const [message, setMessage] = useState("");
    const t = useTranslations("getHelp");

    const createTicket = async (message: string) => {
        const res = await fetch("/api/tickets", {
            method: "POST",
            body: JSON.stringify({ description: message }),
        });

        if (res.ok) {
            const data = await res.json();
            toast.toast({
                title: t("ticketCreated", { id: data.ticket.id }),
                variant: "default",
            });
        } else {
            toast.toast({
                title: t("ticketCreationFailed"),
                variant: "destructive",
            });
        }

        return res;
    };

    return (
        <Card className="w-full flex-1">
            <CardHeader>
                <CardTitle>{t("writeDirectly")}</CardTitle>
                <CardDescription>{t("answerToEmail")}</CardDescription>
            </CardHeader>
            <CardContent>
                <form>
                    <div className="grid w-full items-center">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="framework">{t("yourProblemTitle")}</Label>
                            <Textarea
                                placeholder={t("describeProblemPlaceholder")}
                                rows={4}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={() => createTicket(message)}>{t("submit")}</Button>
            </CardFooter>
        </Card>
    );
}

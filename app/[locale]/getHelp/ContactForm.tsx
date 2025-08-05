"use server"


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


export default async function ContactForm({ t }: { t: any }) {
    return (
        <Card className="w-full flex-1">
            <CardHeader>
                <CardTitle>{t('writeDirectly')}</CardTitle>
                <CardDescription>
                    {t('answerToEmail')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form>
                    <div className="grid w-full items-center">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="framework">{t('yourProblemTitle')}</Label>
                            <Textarea placeholder={t('describeProblemPlaceholder')} rows={4}/>
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button>{t('submit')}</Button>
            </CardFooter>
        </Card>
    );
}

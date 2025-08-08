"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import React from "react";

function NoAdmin() {
  const t = useTranslations();

  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-lg border border-destructive/20">
        <CardHeader className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("notAdmin")}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("notAdminDescription") ||
              "You do not have the necessary permissions to view this page."}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default NoAdmin;

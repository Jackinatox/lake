"use client"

import { authClient } from '@/lib/auth-client'
import { useTranslations } from 'next-intl';
import React from 'react'

function LastLoggedIn() {
    const t = useTranslations("payments");
    const [method, setMethod] = React.useState<string>("");

    React.useEffect(() => {
        const lastMethod = authClient.getLastUsedLoginMethod();
        setMethod(lastMethod);
    }, []);

    return (
        <div>{t("loggedInVia")}: {method.charAt(0).toUpperCase() + method.slice(1)}</div>
    )
}

export default LastLoggedIn
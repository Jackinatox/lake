"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { authClient } from "@/lib/auth-client"
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const brouter = useRouter();
  const t = useTranslations("RegisterLogin");

  const registerUser = async ({ username, email, password }: { username: string; email: string; password: string }) => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: username,
      image: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`,
      callbackURL: "/gameserver",
      // TODO: redirect to EmailVerified
    }, {
      onRequest: () => {
        setLoading(true);
      },
      onSuccess: () => {
        brouter.push("/gameserver");
      },
      onError: () => {
        setError(t("errors.registrationFailedTryAgain"));
      },
    });
    return { success: !!data, error: error?.message };
  }

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordMinLength = 8;
  const passwordsMatch = password === confirmPassword && password.length >= passwordMinLength;
  const passwordTooShort = password.length > 0 && password.length < passwordMinLength;
  const emailValid = email.trim().length > 0;

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (!emailValid) {
      setError(t("validation.emailRequired"));
      setLoading(false);
      return;
    }
    if (password.length < passwordMinLength) {
      setError(t("validation.passwordMin", { min: passwordMinLength }));
      setLoading(false);
      return;
    }
    if (!passwordsMatch) {
      setError(t("validation.passwordsDontMatch"));
      setLoading(false);
      return;
    }
    try {
      const res = await registerUser({ username, email, password });
      if (!res.success) {
        setError(res.error || t("errors.registrationFailed"));
      } else {
        setSuccess(t("success.registration"));
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setError(err.message || t("errors.registrationFailed"));
    } finally {
      setLoading(false);
    }
  }, [username, email, password, confirmPassword, passwordsMatch, emailValid, t]);


  return (
    <div className="flex justify-center">
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t("title")}</CardTitle>
            <CardDescription>
              {t("subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                  <Button variant="outline" className="w-full" type="button" onClick={() => authClient.signIn.social({ provider: "discord", callbackURL: "/gameserver" })}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="mr-2 h-4 w-4"
                      fill="currentColor"
                    >
                      <path d="M18.942 5.556a16.299 16.299 0 0 0-4.126-1.297c-.178.321-.385.754-.529 1.097a15.175 15.175 0 0 0-4.573 0 11.583 11.583 0 0 0-.535-1.097 16.274 16.274 0 0 0-4.129 1.3c-2.611 3.946-3.319 7.794-2.965 11.587a16.494 16.494 0 0 0 5.061 2.593 12.65 12.65 0 0 0 1.084-1.785 10.689 10.689 0 0 1-1.707-.831c.143-.106.283-.217.418-.331 3.291 1.539 6.866 1.539 10.118 0 .137.114.277.225.418.331-.541.326-1.114.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595c.415-4.396-.709-8.209-2.973-11.589zM8.678 14.813c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c.001 1.123-.793 2.045-1.798 2.045zm6.644 0c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c0 1.123-.793 2.045-1.798 2.045z" />
                    </svg>
                    {t("oauth.discord")}
                  </Button>
                  <Button variant="outline" className="w-full" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    {t("oauth.google")}
                  </Button>
                </div>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    {t("orContinueWith")}
                  </span>
                </div>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="username">{t("fields.username")}</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder={t("fields.usernamePlaceholder")}
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="email">{t("fields.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("fields.emailPlaceholder")}
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="password">{t("fields.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      placeholder={t("fields.passwordPlaceholder")}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="confirmPassword">{t("fields.confirmPassword")}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t("fields.confirmPasswordPlaceholder")}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  {passwordTooShort && (
                    <div className="text-red-500 text-xs text-center">{t("validation.passwordMin", { min: passwordMinLength })}</div>
                  )}
                  {!passwordTooShort && !passwordsMatch && confirmPassword.length > 0 && (
                    <div className="text-red-500 text-xs text-center">{t("validation.passwordsDontMatch")}</div>
                  )}
                  {error && (
                    <div className="text-red-500 text-sm text-center mt-2">{error}</div>
                  )}
                  {success && (
                    <div className="text-green-600 text-sm text-center mt-2">{success}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading || !passwordsMatch || passwordTooShort || !emailValid}>
                    {loading ? t("button.registering") : t("button.register")}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  {t("alreadyAccount.text")} {" "}
                  <Link href="/login" className="underline underline-offset-4">
                    {t("alreadyAccount.login")}
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          {t.rich("disclaimer", {
            terms: (chunks) => <a href="#">{chunks}</a>,
            privacy: (chunks) => <a href="#">{chunks}</a>
          })}
        </div>
      </div>
    </div>

  );
}

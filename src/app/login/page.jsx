"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { School, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [siteTitle, setSiteTitle] = useState("eClassroom");
  const [schoolName, setSchoolName] = useState(null);
  const [website, setWebsite] = useState(null);
  const [loginMessage, setLoginMessage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/school-info")
      .then((r) => r.json())
      .then((data) => {
        const info = data.schoolInfo;
        if (info?.site_title?.trim()) setSiteTitle(info.site_title.trim());
        setSchoolName(info?.school_name?.trim() || null);
        setWebsite(info?.website?.trim() || null);
        setLoginMessage(info?.login_message?.trim() || null);
      })
      .catch(() => {});
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const displayName = schoolName || null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 px-4">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <School className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-[var(--font-display)]">
          {siteTitle}
        </h1>
        {displayName && (
          <p className="mt-1 text-sm text-muted-foreground">{displayName}</p>
        )}
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-sm shadow-lg border-border/60">
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {loginMessage && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                {loginMessage}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Username or Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="admin or you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <Button type="submit" className="h-10 w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        {website && (
          <CardFooter className="justify-center border-t px-6 py-3">
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
               Website
            </a>
          </CardFooter>
        )}
      </Card>

      {/* Footer */}
      <p className="mt-6 text-xs text-muted-foreground/60">
        Built by{" "}
        <a
          href="https://Asyraaf.pages.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
        >
          Asyraaf Samson
        </a>
      </p>
    </div>
  );
}

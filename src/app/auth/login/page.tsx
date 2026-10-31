import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "../_components/auth-card";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Log in"
      description="Enter your club account details."
      footer={
        <p>
          No account yet?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary underline underline-offset-4"
          >
            Register
          </Link>
        </p>
      }
    >
      {/* LoginForm reads ?from= with useSearchParams, which needs a Suspense boundary. */}
      <Suspense>
        <LoginForm />
      </Suspense>

      {/* Test-only admin account, shown for reviewers. */}
      <div className="mt-6 rounded-md border bg-muted px-4 py-3 text-[13px]">
        <p className="font-medium">Admin credentials</p>
        <p className="mt-1 text-muted-foreground">
          Email:{" "}
          <span className="text-foreground select-all">admin@criico.com</span>
        </p>
        <p className="text-muted-foreground">
          Password: <span className="text-foreground select-all">admin123</span>
        </p>
      </div>
    </AuthCard>
  );
}

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
    </AuthCard>
  );
}

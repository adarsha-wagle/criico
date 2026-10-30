import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "./_components/register-form";
import { AuthCard } from "../_components/auth-card";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create an account"
      description="New accounts can view players and the leaderboard. An admin can grant edit access."
      footer={
        <p>
          Already registered?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}

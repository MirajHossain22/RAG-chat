import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

async function LoginContent({ searchParams }: LoginPageProps) {
  const reason = (await searchParams).error;
  const initialError =
    reason === "expired_link"
      ? "That sign-in link is invalid or expired. Request a new one."
      : reason === "invalid_callback"
        ? "The sign-in link could not be verified. Request a new one."
        : undefined;

  return <LoginForm initialError={initialError} />;
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={<LoginForm />}>
      <LoginContent {...props} />
    </Suspense>
  );
}

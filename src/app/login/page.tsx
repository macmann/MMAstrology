import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="cosmic-page cosmic-scroll-page">
      <div className="cosmic-shell cosmic-scroll-shell flex w-full items-center px-5 py-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="cosmic-page">
      <div className="cosmic-shell flex w-full items-center px-5">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

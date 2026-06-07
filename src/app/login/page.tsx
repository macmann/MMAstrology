import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-200 text-slate-950 sm:py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] items-center bg-[#eef3f8] px-5 shadow-2xl shadow-slate-400/40 sm:min-h-[calc(100vh-3rem)] sm:rounded-[2.25rem]">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

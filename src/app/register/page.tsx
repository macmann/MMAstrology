import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#4c1d95_0,transparent_35%),#050314] px-6 py-12">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </main>
  );
}

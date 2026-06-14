import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="cosmic-page cosmic-scroll-page">
      <div className="cosmic-shell cosmic-scroll-shell flex w-full items-center px-5 py-8">
        <RegisterForm />
      </div>
    </main>
  );
}

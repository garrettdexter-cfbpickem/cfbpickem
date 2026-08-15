import AdminLoginForm from "@/components/AdminLoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-bold">Admin Login</h1>
      <AdminLoginForm />
    </div>
  );
}

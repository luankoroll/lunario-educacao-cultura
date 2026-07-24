import type { Metadata } from "next";
import { AdminFormsDashboard } from "../../components/AdminFormsDashboard";

export const metadata: Metadata = {
  title: "Painel de formulários",
  robots: {
    follow: false,
    index: false,
  },
};

export default function AdminFormsPage() {
  return (
    <div className="admin-shell">
      <AdminFormsDashboard />
    </div>
  );
}

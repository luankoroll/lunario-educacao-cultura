import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "../../components/AdminLoginForm";

export const metadata: Metadata = {
  title: "Acesso administrativo",
  robots: {
    follow: false,
    index: false,
  },
};

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page admin-shell" id="conteudo">
      <section className="admin-login-card">
        <Link className="admin-wordmark" href="/">
          Lunário
        </Link>
        <p className="eyebrow">Área privada</p>
        <h1>Acesso do administrador</h1>
        <p className="admin-login-card__intro">
          Entre com as credenciais do professor responsável para consultar as
          respostas dos formulários.
        </p>
        <AdminLoginForm />
        <Link className="admin-back-link" href="/">
          Voltar ao site
        </Link>
      </section>
    </main>
  );
}

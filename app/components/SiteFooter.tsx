import { Brand } from "./Brand";
import { navItems } from "../lib/content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell">
        <div className="site-footer__lead">
          <Brand />
          <p>
            Lunário é um espaço dedicado à educação, à literatura, à cultura e
            à produção crítica.
          </p>
        </div>

        <div className="site-footer__columns">
          <nav aria-label="Seções do site">
            <p className="footer-label">Navegação</p>
            {navItems.map((item) => (
              <a href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div>
            <p className="footer-label">Contato</p>
            <a href="mailto:contato@lunario.com.br">
              contato@lunario.com.br
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram — perfil editável"
            >
              Instagram
            </a>
          </div>

          <div>
            <p className="footer-label">Informações</p>
            <a href="/politica-de-privacidade">Política de privacidade</a>
            <a href="/formularios/contato">Propostas e parcerias</a>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© 2026 Lunário. Todos os direitos reservados.</p>
          <p>Educação · Literatura · Cultura</p>
        </div>
      </div>
    </footer>
  );
}

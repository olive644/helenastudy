import { PageHeader } from "../components/app-navigation";
import { NavigationIcon } from "../components/navigation-icon";

export function ProfileView() {
  return (
    <main className="main-content profile-view" id="main-content">
      <PageHeader />
      <section className="profile-coming-soon" aria-labelledby="profile-title">
        <span className="profile-coming-soon__icon" aria-hidden="true">
          <NavigationIcon name="profile" />
        </span>
        <span className="section-label">Perfil</span>
        <h1 id="profile-title">Em produção</h1>
        <p>Mais informações em breve.</p>
        <small>Configurações de perfil, conta e aplicativo chegarão aqui.</small>
      </section>
    </main>
  );
}

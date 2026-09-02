import { useState } from "react";
import { PageHeader } from "../components/app-navigation";
import {
  ACTIVITY_LIBRARY,
  CONTROL_LEVEL_LABELS,
  type ActivityDefinition,
  type ControlLevel,
} from "../domain/activity-bank";

type FilterValue = ControlLevel | "all";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "total-controlled", label: CONTROL_LEVEL_LABELS["total-controlled"] },
  { value: "semi-controlled", label: CONTROL_LEVEL_LABELS["semi-controlled"] },
];

function ActivityCard({ activity }: { activity: ActivityDefinition }) {
  return (
    <article className="bank-card">
      <div className="bank-card__heading">
        <h3>{activity.name}</h3>
        <span className={`bank-tag bank-tag--${activity.controlLevel}`}>
          {CONTROL_LEVEL_LABELS[activity.controlLevel]}
        </span>
      </div>
      <dl className="bank-card__meta">
        <div>
          <dt>Time</dt>
          <dd>{activity.time} min</dd>
        </div>
        <div>
          <dt>Topic</dt>
          <dd>{activity.topic}</dd>
        </div>
      </dl>
      <div className="bank-card__block">
        <span>Goal</span>
        <p>{activity.goal}</p>
      </div>
      <div className="bank-card__block">
        <span>Steps</span>
        <ol>
          {activity.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      {activity.supplies.length > 0 && (
        <div className="bank-card__block">
          <span>Supplies</span>
          <p>{activity.supplies.join(", ")}</p>
        </div>
      )}
      {activity.links.length > 0 && (
        <div className="bank-card__block">
          <span>Links</span>
          <ul className="homework-links">
            {activity.links.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noopener noreferrer">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function ActivityBankView({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const activities =
    filter === "all"
      ? ACTIVITY_LIBRARY
      : ACTIVITY_LIBRARY.filter((activity) => activity.controlLevel === filter);

  return (
    <main className="main-content" id="main-content">
      <PageHeader />
      <header className="builder__header">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
          aria-label="Voltar para Hoje"
        >
          <span aria-hidden="true">←</span>
        </button>
        <div>
          <span className="section-label">Planejamento</span>
          <h1>Banco de atividades</h1>
          <p>
            {ACTIVITY_LIBRARY.length} atividades prontas para o Practice e a Extra Activity do plano
            de aula, classificadas por Time, Topic, Steps, Goal, Supplies e Links.
          </p>
        </div>
      </header>

      <div className="bank-filters" role="group" aria-label="Filtrar por nível de controle">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={filter === option.value ? "bank-filter bank-filter--active" : "bank-filter"}
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="bank-grid">
        {activities.map((activity) => (
          <ActivityCard activity={activity} key={activity.id} />
        ))}
      </div>
    </main>
  );
}

export default ActivityBankView;

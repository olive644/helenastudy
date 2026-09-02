import { useState, type Dispatch, type FormEvent } from "react";
import type { HomeworkList, WorkspaceAction, WorkspaceState } from "../domain/workspace";

type HomeworkSectionProps = {
  workspace: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
};

function HomeworkListCard({
  list,
  dispatch,
}: {
  list: HomeworkList;
  dispatch: Dispatch<WorkspaceAction>;
}) {
  const [itemTitle, setItemTitle] = useState("");
  const completed = list.items.filter((item) => item.completed).length;
  const progress = list.items.length === 0 ? 0 : Math.round((completed / list.items.length) * 100);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = itemTitle.trim();
    if (!title) return;
    dispatch({ type: "homework-item/added", listId: list.id, title });
    setItemTitle("");
  }

  return (
    <article className="homework-card">
      <div className="homework-card__progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="homework-card__heading">
        <h3>{list.title}</h3>
        <button
          className="homework-card__delete"
          type="button"
          aria-label={`Excluir lista ${list.title}`}
          onClick={() => dispatch({ type: "homework-list/removed", id: list.id })}
        >
          <span aria-hidden="true">🗑</span>
        </button>
      </div>
      {list.items.length > 0 && (
        <ul className="homework-item-list">
          {list.items.map((item) => (
            <li key={item.id}>
              <label>
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() =>
                    dispatch({ type: "homework-item/toggled", listId: list.id, itemId: item.id })
                  }
                />
                <span className={item.completed ? "is-complete" : undefined}>{item.title}</span>
              </label>
              <button
                type="button"
                aria-label={`Remover ${item.title}`}
                onClick={() =>
                  dispatch({ type: "homework-item/removed", listId: list.id, itemId: item.id })
                }
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="homework-add-item" onSubmit={addItem}>
        <input
          value={itemTitle}
          onChange={(event) => setItemTitle(event.target.value)}
          placeholder="Novo item"
          aria-label={`Novo item em ${list.title}`}
        />
        <button type="submit">+ Adicionar item</button>
      </form>
    </article>
  );
}

// Seção de Homework embutida na Agenda (Planner): listas de deveres com itens
// marcáveis, ao lado de tarefas e compromissos. Não é mais uma tela própria
// porque duplicava a lista de tarefas da Agenda; aqui ela complementa em vez
// de repetir.
export function HomeworkSection({ workspace, dispatch }: HomeworkSectionProps) {
  const [listTitle, setListTitle] = useState("");
  const defaultSubject = workspace.subjects[0];

  if (!defaultSubject) return null;

  function addList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = listTitle.trim();
    if (!title || !defaultSubject) return;
    dispatch({
      type: "homework-list/added",
      subjectId: defaultSubject.id,
      title,
      createdAt: new Date().toISOString(),
    });
    setListTitle("");
  }

  return (
    <section className="module-panel" aria-labelledby="homework-section-title">
      <div className="module-heading">
        <h2 id="homework-section-title">Homework</h2>
        <span>{workspace.homeworkLists.length}</span>
      </div>
      <form className="homework-new-list" onSubmit={addList}>
        <label className="field field--full">
          <span>Nova lista</span>
          <input
            value={listTitle}
            onChange={(event) => setListTitle(event.target.value)}
            placeholder="Ex.: Lição de casa da semana"
            required
          />
        </label>
        <button className="primary-button" type="submit">
          <span aria-hidden="true">+</span> Adicionar lista
        </button>
      </form>

      {workspace.homeworkLists.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma lista de homework ainda. Crie a primeira acima.</p>
        </div>
      ) : (
        <div className="homework-grid">
          {workspace.homeworkLists.map((list) => (
            <HomeworkListCard list={list} dispatch={dispatch} key={list.id} />
          ))}
        </div>
      )}
    </section>
  );
}

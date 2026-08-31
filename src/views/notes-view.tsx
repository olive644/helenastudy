import { lazy, Suspense, useState, type Dispatch } from "react";
import { PageHeader } from "../components/app-navigation";
import type { WorkspaceAction, WorkspaceState } from "../domain/workspace";

const NoteCaptureTools = lazy(() => import("../components/note-capture-tools"));

type NotesViewProps = {
  workspace: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
};

export function NotesView({ workspace, dispatch }: NotesViewProps) {
  const defaultSubject = workspace.subjects[0];
  const [newNoteSubjectId, setNewNoteSubjectId] = useState(defaultSubject?.id ?? "");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(workspace.notes[0]?.id ?? null);
  const resolvedActiveNoteId = activeNoteId ?? workspace.notes[0]?.id ?? null;
  const activeNote = workspace.notes.find((note) => note.id === resolvedActiveNoteId) ?? null;

  if (!defaultSubject) return null;
  const activeSubject = activeNote
    ? (workspace.subjects.find((item) => item.id === activeNote.subjectId) ?? defaultSubject)
    : defaultSubject;

  function createNote() {
    setActiveNoteId(null);
    dispatch({
      type: "note/added",
      subjectId: newNoteSubjectId,
      updatedAt: new Date().toISOString(),
    });
  }

  function updateNote(title: string, content: string) {
    if (!activeNote) return;
    dispatch({
      type: "note/updated",
      id: activeNote.id,
      title,
      content,
      updatedAt: new Date().toISOString(),
    });
  }

  function saveAsset(kind: "scan" | "drawing", name: string, dataUrl: string) {
    if (!activeNote) return;
    dispatch({
      type: "note/asset-added",
      noteId: activeNote.id,
      kind,
      name,
      dataUrl,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <main className="main-content" id="main-content">
      <PageHeader />
      <header className="view-heading view-heading--with-action">
        <div>
          <span className="section-label">Cadernos</span>
          <h1>Escreva antes de esquecer.</h1>
          <p>Digite, digitalize uma página ou escreva à mão no mesmo caderno.</p>
        </div>
        <div className="new-note-action">
          <label>
            <span>Matéria da nova nota</span>
            <select
              value={newNoteSubjectId}
              onChange={(event) => setNewNoteSubjectId(event.target.value)}
            >
              {workspace.subjects.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="button" onClick={createNote}>
            <span aria-hidden="true">+</span> Nova anotação
          </button>
        </div>
      </header>

      <div className="notes-layout">
        <aside className="note-list" aria-label="Anotações">
          {workspace.notes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">
                N
              </span>
              <p>Nenhuma anotação criada.</p>
            </div>
          ) : (
            workspace.notes.map((note) => (
              <button
                className={
                  note.id === resolvedActiveNoteId ? "note-list__item is-active" : "note-list__item"
                }
                type="button"
                onClick={() => setActiveNoteId(note.id)}
                key={note.id}
              >
                <strong>{note.title || "Sem título"}</strong>
                <span>
                  {note.content ||
                    (note.assets.length > 0
                      ? `${note.assets.length} imagem${note.assets.length === 1 ? "" : "s"}`
                      : "Anotação vazia")}
                </span>
              </button>
            ))
          )}
        </aside>

        <section className="note-editor" aria-label="Editor de anotação">
          {activeNote ? (
            <>
              <div className="note-editor__meta">
                <span>{activeSubject.name}</span>
                <small>Salva automaticamente</small>
              </div>
              <Suspense fallback={<span className="capture-loading">Abrindo ferramentas…</span>}>
                <NoteCaptureTools onSave={saveAsset} />
              </Suspense>
              <input
                className="note-title-input"
                aria-label="Título da anotação"
                value={activeNote.title}
                onChange={(event) => updateNote(event.target.value, activeNote.content)}
              />
              <textarea
                aria-label="Conteúdo da anotação"
                value={activeNote.content}
                onChange={(event) => updateNote(activeNote.title, event.target.value)}
                placeholder="Comece a escrever..."
              />
              {activeNote.assets.length > 0 && (
                <section className="note-assets" aria-label="Imagens da anotação">
                  <h2>Imagens</h2>
                  <div>
                    {activeNote.assets.map((asset) => (
                      <figure key={asset.id}>
                        <img src={asset.dataUrl} alt={asset.name} />
                        <figcaption>
                          <span>
                            <strong>{asset.name}</strong>
                            <small>
                              {asset.kind === "scan" ? "Digitalização" : "Escrita à mão"}
                            </small>
                          </span>
                          <button
                            type="button"
                            aria-label={`Remover ${asset.name}`}
                            onClick={() =>
                              dispatch({
                                type: "note/asset-removed",
                                noteId: activeNote.id,
                                assetId: asset.id,
                                updatedAt: new Date().toISOString(),
                              })
                            }
                          >
                            Remover
                          </button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="note-editor__empty">
              <span className="empty-mark" aria-hidden="true">
                N
              </span>
              <h2>Selecione ou crie uma anotação</h2>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default NotesView;

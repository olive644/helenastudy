import { describe, expect, it } from "vitest";
import {
  buildBingoLabels,
  createInitialWorkspace,
  dueFlashcards,
  hasBingo,
  minutesFocusedOn,
  workspaceReducer,
} from "./workspace";

describe("workspaceReducer", () => {
  it("conecta tarefas e sessões de foco ao espaço de estudos", () => {
    const initial = createInitialWorkspace();
    const withTask = workspaceReducer(initial, {
      type: "task/added",
      title: "Estudar verbos",
      subjectId: "subject-english",
      dueDate: "2026-08-29",
    });
    const task = withTask.tasks[0];
    expect(task?.title).toBe("Estudar verbos");

    const completed = task
      ? workspaceReducer(withTask, { type: "task/toggled", id: task.id })
      : withTask;
    expect(completed.tasks[0]?.completed).toBe(true);

    const focused = workspaceReducer(completed, {
      type: "focus/recorded",
      subjectId: "subject-english",
      durationMinutes: 25,
      completedAt: "2026-08-29T18:00:00.000Z",
    });
    expect(minutesFocusedOn(focused, "2026-08-29")).toBe(25);
  });

  it("marca e desmarca o mesmo hábito no dia", () => {
    const withHabit = workspaceReducer(createInitialWorkspace(), {
      type: "habit/added",
      title: "Revisar flashcards",
    });
    const habit = withHabit.habits[0];
    expect(habit).toBeDefined();
    if (!habit) return;

    const checked = workspaceReducer(withHabit, {
      type: "habit/toggled",
      id: habit.id,
      date: "2026-08-29",
    });
    expect(checked.habits[0]?.completedDates).toEqual(["2026-08-29"]);

    const unchecked = workspaceReducer(checked, {
      type: "habit/toggled",
      id: habit.id,
      date: "2026-08-29",
    });
    expect(unchecked.habits[0]?.completedDates).toEqual([]);
  });

  it("agenda revisões de flashcards conforme a dificuldade", () => {
    const withCard = workspaceReducer(createInitialWorkspace(), {
      type: "flashcard/added",
      subjectId: "subject-english",
      front: "Improve",
      back: "Melhorar",
      createdOn: "2026-08-30",
    });
    const card = withCard.flashcards[0];
    expect(dueFlashcards(withCard, "2026-08-30")).toHaveLength(1);
    if (!card) return;

    const reviewed = workspaceReducer(withCard, {
      type: "flashcard/reviewed",
      id: card.id,
      rating: "easy",
      reviewedOn: "2026-08-30",
    });
    expect(reviewed.flashcards[0]?.intervalDays).toBe(3);
    expect(reviewed.flashcards[0]?.nextReview).toBe("2026-09-02");
    expect(dueFlashcards(reviewed, "2026-08-30")).toHaveLength(0);
  });

  it("salva imagens na anotação e permite removê-las", () => {
    const withNote = workspaceReducer(createInitialWorkspace(), {
      type: "note/added",
      subjectId: "subject-english",
      updatedAt: "2026-08-31T10:00:00.000Z",
    });
    const note = withNote.notes[0];
    if (!note) return;

    const withAsset = workspaceReducer(withNote, {
      type: "note/asset-added",
      noteId: note.id,
      kind: "drawing",
      name: "Mapa desenhado",
      dataUrl: "data:image/png;base64,AAAA",
      createdAt: "2026-08-31T10:05:00.000Z",
    });
    const asset = withAsset.notes[0]?.assets[0];
    expect(asset).toMatchObject({ kind: "drawing", name: "Mapa desenhado" });
    if (!asset) return;

    const removed = workspaceReducer(withAsset, {
      type: "note/asset-removed",
      noteId: note.id,
      assetId: asset.id,
      updatedAt: "2026-08-31T10:06:00.000Z",
    });
    expect(removed.notes[0]?.assets).toEqual([]);
  });

  it("cria uma cartela e reconhece uma sequência de bingo", () => {
    const labels = buildBingoLabels(["Present Perfect", "Phrasal verbs"]);
    expect(labels).toHaveLength(9);
    expect(labels[0]).toBe("Revise: Present Perfect");

    let workspace = workspaceReducer(createInitialWorkspace(), {
      type: "bingo/created",
      subjectId: "subject-english",
      labels,
      createdAt: "2026-08-31T10:00:00.000Z",
    });
    const board = workspace.bingoBoards[0];
    expect(board?.cells).toHaveLength(9);
    if (!board) return;

    for (const cell of board.cells.slice(0, 3)) {
      workspace = workspaceReducer(workspace, {
        type: "bingo/cell-toggled",
        boardId: board.id,
        cellId: cell.id,
      });
    }
    const completedBoard = workspace.bingoBoards[0];
    expect(completedBoard && hasBingo(completedBoard)).toBe(true);
  });
});

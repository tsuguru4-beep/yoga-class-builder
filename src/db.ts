import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { SEED_ASSESSMENTS } from './seedAssessments';
import type { AssessmentDef, ClassPlan } from './types';

interface Schema extends DBSchema {
  classes: { key: string; value: ClassPlan };
  assessments: { key: string; value: AssessmentDef };
}

let dbp: Promise<IDBPDatabase<Schema>> | null = null;

function db() {
  if (!dbp) {
    dbp = openDB<Schema>('yoga-class-builder', 1, {
      upgrade(d, _old, _new, tx) {
        d.createObjectStore('classes', { keyPath: 'id' });
        d.createObjectStore('assessments', { keyPath: 'id' });
        const store = tx.objectStore('assessments');
        for (const a of SEED_ASSESSMENTS) void store.put(a);
      },
    });
    // ブラウザに勝手に消されないよう永続化を依頼（対応端末のみ）
    void navigator.storage?.persist?.();
  }
  return dbp;
}

export async function listClasses(): Promise<ClassPlan[]> {
  const all = await (await db()).getAll('classes');
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getClass(id: string): Promise<ClassPlan | undefined> {
  return (await db()).get('classes', id);
}

export async function putClass(plan: ClassPlan): Promise<void> {
  await (await db()).put('classes', plan);
}

export async function deleteClass(id: string): Promise<void> {
  await (await db()).delete('classes', id);
}

export async function listAssessments(): Promise<AssessmentDef[]> {
  const all = await (await db()).getAll('assessments');
  const order = new Map(SEED_ASSESSMENTS.map((a, i) => [a.id, i]));
  return all.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999) || a.name.localeCompare(b.name, 'ja'));
}

export async function putAssessment(a: AssessmentDef): Promise<void> {
  await (await db()).put('assessments', a);
}

export async function deleteAssessment(id: string): Promise<void> {
  await (await db()).delete('assessments', id);
}

/** 初期データを元に戻す（自分で追加した項目は残す） */
export async function restoreSeedAssessments(): Promise<void> {
  const d = await db();
  const tx = d.transaction('assessments', 'readwrite');
  for (const a of SEED_ASSESSMENTS) await tx.store.put(a);
  await tx.done;
}

// ---- バックアップ ----

export interface BackupFile {
  app: 'yoga-class-builder';
  version: 1;
  exportedAt: string;
  classes: ClassPlan[];
  assessments: AssessmentDef[];
  includesParticipants: boolean;
}

export async function exportAll(includeParticipants: boolean): Promise<BackupFile> {
  const classes = await listClasses();
  const assessments = await listAssessments();
  return {
    app: 'yoga-class-builder',
    version: 1,
    exportedAt: new Date().toISOString(),
    classes: includeParticipants
      ? classes
      : classes.map((c) => ({
          ...c,
          sessions: c.sessions.map((s) => ({
            ...s,
            records: s.records.map(({ participants: _p, ...r }) => r),
          })),
        })),
    assessments,
    includesParticipants: includeParticipants,
  };
}

export async function importAll(data: unknown, mode: 'merge' | 'replace'): Promise<{ classes: number; assessments: number }> {
  const f = data as Partial<BackupFile>;
  if (f?.app !== 'yoga-class-builder' || !Array.isArray(f.classes) || !Array.isArray(f.assessments)) {
    throw new Error('クラスビルダーのバックアップファイルではありません');
  }
  const d = await db();
  const tx = d.transaction(['classes', 'assessments'], 'readwrite');
  if (mode === 'replace') {
    await tx.objectStore('classes').clear();
    await tx.objectStore('assessments').clear();
  }
  for (const c of f.classes) await tx.objectStore('classes').put({ ...c, sessions: c.sessions ?? [] });
  for (const a of f.assessments) await tx.objectStore('assessments').put(a);
  await tx.done;
  return { classes: f.classes.length, assessments: f.assessments.length };
}

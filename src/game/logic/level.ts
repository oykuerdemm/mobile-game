import type { TileType } from './types';

export interface LevelGoal {
  type: TileType;
  count: number;
}

export interface LevelConfig {
  id: number;
  moveLimit: number;
  goal: LevelGoal;
}

export type SessionStatus = 'playing' | 'won' | 'lost';

export interface SessionState {
  level: LevelConfig;
  movesRemaining: number;
  collected: number;
  status: SessionStatus;
}

export function createSession(level: LevelConfig): SessionState {
  return { level, movesRemaining: level.moveLimit, collected: 0, status: 'playing' };
}

/** Applies the result of one player move (a swap that produced at least one match). */
export function applyMove(session: SessionState, clearedCounts: ReadonlyMap<TileType, number>): SessionState {
  if (session.status !== 'playing') return session;

  const collected = session.collected + (clearedCounts.get(session.level.goal.type) ?? 0);
  const movesRemaining = session.movesRemaining - 1;

  let status: SessionStatus = 'playing';
  if (collected >= session.level.goal.count) {
    status = 'won';
  } else if (movesRemaining <= 0) {
    status = 'lost';
  }

  return { ...session, collected, movesRemaining, status };
}

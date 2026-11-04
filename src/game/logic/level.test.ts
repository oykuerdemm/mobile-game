import { describe, expect, it } from 'vitest';
import { applyMove, createSession, type LevelConfig } from './level';
import { TileType } from './types';

const level: LevelConfig = {
  id: 1,
  moveLimit: 3,
  goal: { type: TileType.Red, count: 10 },
};

describe('createSession', () => {
  it('starts at the level move limit with no progress', () => {
    const session = createSession(level);
    expect(session).toEqual({ level, movesRemaining: 3, collected: 0, status: 'playing' });
  });
});

describe('applyMove', () => {
  it('adds only goal-type tiles to progress and decrements moves', () => {
    const session = createSession(level);
    const next = applyMove(session, new Map([[TileType.Red, 4], [TileType.Blue, 7]]));
    expect(next.collected).toBe(4);
    expect(next.movesRemaining).toBe(2);
    expect(next.status).toBe('playing');
  });

  it('transitions to won once the goal count is reached', () => {
    let session = createSession(level);
    session = applyMove(session, new Map([[TileType.Red, 6]]));
    session = applyMove(session, new Map([[TileType.Red, 4]]));
    expect(session.collected).toBe(10);
    expect(session.status).toBe('won');
  });

  it('transitions to lost when moves run out before the goal is reached', () => {
    let session = createSession(level);
    session = applyMove(session, new Map([[TileType.Red, 1]]));
    session = applyMove(session, new Map([[TileType.Red, 1]]));
    session = applyMove(session, new Map([[TileType.Red, 1]]));
    expect(session.movesRemaining).toBe(0);
    expect(session.collected).toBe(3);
    expect(session.status).toBe('lost');
  });

  it('prefers a win when the goal and the move limit are both hit on the same move', () => {
    let session = createSession({ ...level, moveLimit: 1 });
    session = applyMove(session, new Map([[TileType.Red, 10]]));
    expect(session.status).toBe('won');
  });

  it('is a no-op once the session is no longer playing', () => {
    let session = createSession({ ...level, moveLimit: 1 });
    session = applyMove(session, new Map([[TileType.Red, 10]]));
    const after = applyMove(session, new Map([[TileType.Red, 10]]));
    expect(after).toEqual(session);
  });
});

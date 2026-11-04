export interface DifficultyConfig {
  /**
   * Probability (0-1) that a newly refilled tile avoids completing an immediate
   * match with its neighbors. 0 = fully random (frequent instant chains), 1 =
   * (almost) never spawns an immediate match. Tune this to make the game feel
   * more or less "lucky" without touching gameplay code.
   */
  refillAvoidMatchChance: number;
}

export const DEFAULT_DIFFICULTY: DifficultyConfig = {
  refillAvoidMatchChance: 0.7,
};

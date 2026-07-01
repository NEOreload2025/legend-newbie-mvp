import { CLASS_STATS, type ClassData, type PlayerClass } from './ClassStats';

class GameStateManager {
  selectedClass: PlayerClass | null = null;

  selectClass(playerClass: PlayerClass): void {
    this.selectedClass = playerClass;
  }

  getClassData(): ClassData {
    if (!this.selectedClass) {
      return CLASS_STATS.warrior;
    }
    return CLASS_STATS[this.selectedClass];
  }

  reset(): void {
    this.selectedClass = null;
  }
}

export const GameState = new GameStateManager();

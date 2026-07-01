export type PlayerClass = 'warrior' | 'mage' | 'taoist';

export interface ClassData {
  id: PlayerClass;
  name: string;
  nameCn: string;
  description: string;
  hp: number;
  atk: number;
  def: number;
  attackSpeed: number;
  tint: number;
}

export const CLASS_STATS: Record<PlayerClass, ClassData> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    nameCn: '戰士',
    description: '高防高血，穩定輸出',
    hp: 120,
    atk: 10,
    def: 12,
    attackSpeed: 1000,
    tint: 0xcc3333,
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    nameCn: '法師',
    description: '高傷低防，爆發輸出',
    hp: 70,
    atk: 18,
    def: 4,
    attackSpeed: 1200,
    tint: 0x3366cc,
  },
  taoist: {
    id: 'taoist',
    name: 'Taoist',
    nameCn: '道士',
    description: '均衡萬能，弱寵跟隨助戰',
    hp: 90,
    atk: 11,
    def: 7,
    attackSpeed: 1000,
    tint: 0x33aa88,
  },
};

export function computeDamage(atk: number, def: number): number {
  return Math.max(1, Math.round(atk - def * 0.5));
}

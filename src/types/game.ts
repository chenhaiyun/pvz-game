export type PlantType = 'sunflower' | 'peashooter';

export interface Plant {
    x: number;
    y: number;
    type: PlantType;
    health: number;
    lastShot: number;
}

export interface Zombie {
    x: number;
    y: number;
    speed: number;
    health: number;
}

export interface Projectile {
    x: number;
    y: number;
    speed: number;
}

export interface GameState {
    sunCount: number;
    isPlacingPlant: boolean;
    selectedPlant: PlantType | null;
    plants: Plant[];
    zombies: Zombie[];
    projectiles: Projectile[];
    gameOver: boolean;
}
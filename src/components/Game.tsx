'use client';

import { useEffect, useRef, useState } from 'react';
import { GameState, Plant, PlantType, Projectile, Zombie } from '@/types/game';

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>({
        sunCount: 100,
        isPlacingPlant: false,
        selectedPlant: null,
        plants: [],
        zombies: [],
        projectiles: [],
        gameOver: false
    });

    const placePlant = (type: PlantType) => {
        const cost = type === 'sunflower' ? 50 : 100;
        if (gameState.sunCount >= cost) {
            setGameState(prev => ({
                ...prev,
                isPlacingPlant: true,
                selectedPlant: type
            }));
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleCanvasClick = (e: MouseEvent) => {
            if (!gameState.isPlacingPlant || !gameState.selectedPlant) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const plantExists = gameState.plants.some(plant =>
                Math.abs(plant.x - x) < 40 && Math.abs(plant.y - y) < 40
            );

            if (!plantExists) {
                const cost = gameState.selectedPlant === 'sunflower' ? 50 : 100;
                if (gameState.sunCount >= cost) {
                    setGameState(prev => ({
                        ...prev,
                        plants: [...prev.plants, {
                            x,
                            y,
                            type: gameState.selectedPlant!,
                            health: 100,
                            lastShot: 0
                        }],
                        sunCount: prev.sunCount - cost,
                        isPlacingPlant: false,
                        selectedPlant: null
                    }));
                }
            }
        };

        canvas.addEventListener('click', handleCanvasClick);

        const gameLoop = () => {
            if (gameState.gameOver) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.font = '48px Arial';
                ctx.fillText('游戏结束!', canvas.width/2 - 100, canvas.height/2);
                return;
            }

            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 绘制草地格子
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#90EE90' : '#98FB98';
                ctx.fillRect(0, i * 70 + 20, canvas.width, 70);
            }

            // 绘制植物
            gameState.plants.forEach(plant => {
                ctx.fillStyle = plant.type === 'sunflower' ? 'yellow' : 'green';
                ctx.beginPath();
                ctx.arc(plant.x, plant.y, 20, 0, Math.PI * 2);
                ctx.fill();
            });

            // 绘制僵尸
            gameState.zombies.forEach(zombie => {
                ctx.fillStyle = 'gray';
                ctx.fillRect(zombie.x - 15, zombie.y - 25, 30, 50);
            });

            // 绘制豌豆
            gameState.projectiles.forEach(projectile => {
                ctx.fillStyle = 'lightgreen';
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        const updateGame = () => {
            setGameState(prev => {
                if (prev.gameOver) return prev;

                // 生成阳光
                let newSunCount = prev.sunCount;
                prev.plants.forEach(plant => {
                    if (plant.type === 'sunflower' && Math.random() < 0.02) {
                        newSunCount += 25;
                    }
                });

                // 生成僵尸
                const newZombies = [...prev.zombies];
                if (Math.random() < 0.02) {
                    newZombies.push({
                        x: canvas.width,
                        y: 50 + Math.floor(Math.random() * 5) * 70,
                        speed: 1,
                        health: 100
                    });
                }

                // 更新僵尸位置
                newZombies.forEach(zombie => {
                    zombie.x -= zombie.speed;
                });

                // 射击
                const currentTime = Date.now();
                const newProjectiles = [...prev.projectiles];
                prev.plants.forEach(plant => {
                    if (plant.type === 'peashooter' && currentTime - plant.lastShot > 2000) {
                        newProjectiles.push({
                            x: plant.x,
                            y: plant.y,
                            speed: 5
                        });
                        plant.lastShot = currentTime;
                    }
                });

                // 更新豌豆位置
                newProjectiles.forEach((projectile, index) => {
                    projectile.x += projectile.speed;
                    if (projectile.x > canvas.width) {
                        newProjectiles.splice(index, 1);
                    }
                });

                // 碰撞检测
                const newPlants = [...prev.plants];
                newProjectiles.forEach((projectile, pIndex) => {
                    newZombies.forEach((zombie, zIndex) => {
                        if (Math.abs(projectile.x - zombie.x) < 20 && Math.abs(projectile.y - zombie.y) < 30) {
                            zombie.health -= 20;
                            newProjectiles.splice(pIndex, 1);
                            if (zombie.health <= 0) {
                                newZombies.splice(zIndex, 1);
                            }
                        }
                    });
                });

                newZombies.forEach(zombie => {
                    newPlants.forEach((plant, index) => {
                        if (Math.abs(zombie.x - plant.x) < 30 && Math.abs(zombie.y - plant.y) < 30) {
                            plant.health -= 0.5;
                            if (plant.health <= 0) {
                                newPlants.splice(index, 1);
                            }
                        }
                    });
                });

                // 检查游戏结束
                const gameOver = newZombies.some(zombie => zombie.x <= 0);

                return {
                    ...prev,
                    sunCount: newSunCount,
                    plants: newPlants,
                    zombies: newZombies,
                    projectiles: newProjectiles,
                    gameOver
                };
            });
        };

        const animationId = requestAnimationFrame(gameLoop);
        const intervalId = setInterval(updateGame, 50);

        return () => {
            cancelAnimationFrame(animationId);
            clearInterval(intervalId);
            canvas.removeEventListener('click', handleCanvasClick);
        };
    }, [gameState]);

    return (
        <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-4">植物大战僵尸</h1>
            <div className="mb-4 space-x-4">
                <button
                    className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500"
                    onClick={() => placePlant('sunflower')}
                >
                    放置向日葵 (50阳光)
                </button>
                <button
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() => placePlant('peashooter')}
                >
                    放置豌豆射手 (100阳光)
                </button>
                <span className="text-lg">阳光: {gameState.sunCount}</span>
            </div>
            <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="border-2 border-black bg-sky-200"
            />
        </div>
    );
}
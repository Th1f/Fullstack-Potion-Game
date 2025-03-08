'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Potion {
  id: number;
  type: string;
  name: string;
  incompatibleWith: number[];
}

interface Room {
  id: number;
  potions: number[];
}

interface BestSolution{
  leastAmountIncompatibilities: number;
  bestRoomAssignment: string;
}

let solution: BestSolution = {
  leastAmountIncompatibilities: 0,
  bestRoomAssignment: ""
};

async function fetchBestSolution(numRooms: number, numPotions: number, numIncompatibilities: number, incompatibilities: number[][]): Promise<BestSolution> {
  try {
    const params = {
      numRooms: numRooms.toString(),
      numPotions: numPotions.toString(),
      numIncompatibilities: numIncompatibilities.toString(),
      incompatibilities: incompatibilities.map(group => group.join(',')).join(';')
    };

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const response = await fetch(`https://potion-game-api.onrender.com/api?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch best solution');
    }

    const data = await response.json();
    return data as BestSolution;
  } catch (error) {
    console.error("Failed to fetch best solution:", error);
    throw error;
  }
}

const POTION_TYPES = [
  { type: '💗', name: 'Healing' },
  { type: '☠️', name: 'Poison' },
  { type: '💪', name: 'Strength' },
  { type: '🎯', name: 'Accuracy' },
  { type: '🛡️', name: 'Defense' },
  { type: '⚡', name: 'Speed' },
  { type: '🧠', name: 'Intel' },
  { type: '⚔️', name: 'Battle' },
  { type: '🌟', name: 'Magic' },
  { type: '🔥', name: 'Fire' }
] as const;

declare global {
  interface Window {
    level: number;
  }
}

const generateRandomLevel = async (): Promise<{
  potions: Potion[];
  roomCount: number;
  levelInfo: {
    chemicals: number;
    rooms: number;
    groups: number;
    incompatibleGroups: number[][];
    potionDetails: {
      id: number;
      type: string;
      name: string;
      incompatibleWith: number[];
    }[];
  };
}> => {
  
  const level = window.level || 1; 
  
  const availableTypes = [...POTION_TYPES].slice(0, Math.max(10 - Math.floor(level * 0.75), 4));
  
  const maxPotionsForLevel = Math.min(4 + Math.floor(level * 0.75), availableTypes.length);
  const numPotions = maxPotionsForLevel;
  
  const numRooms = Math.max(
    2,
    level <= 2 ? 4 : 
    level <= 4 ? 3 : 
    Math.random() < 0.5 ? 2 : 3 
  );
  
  const baseIncompatibilities = level; 
  const maxPossibleIncompatibilities = Math.floor((numPotions * (numPotions - 1)) / 2); 
  const maxIncompatibilities = Math.min(
    Math.floor(maxPossibleIncompatibilities * Math.min(0.9, 0.3 + (level * 0.1))), 
    maxPossibleIncompatibilities
  );
  const numIncompatibilities = Math.min(baseIncompatibilities, maxIncompatibilities);

  const availableTypesForLevel = [...availableTypes];
  const potions: Potion[] = Array.from({ length: Math.min(numPotions, availableTypesForLevel.length) }, (_, i) => {
    const typeIndex = Math.floor(Math.random() * availableTypesForLevel.length);
    const potionType = availableTypesForLevel.splice(typeIndex, 1)[0];
    
    return {
      id: i,
      type: potionType.type,
      name: potionType.name,
      incompatibleWith: []
    };
  });

  const incompatibilityGroups: number[][] = [];
  const possiblePairs: number[][] = [];
  
  for (let i = 0; i < potions.length; i++) {
    for (let j = i + 1; j < potions.length; j++) {
      possiblePairs.push([i, j]);
    }
  }

  for (let i = possiblePairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possiblePairs[i], possiblePairs[j]] = [possiblePairs[j], possiblePairs[i]];
  }

  for (let i = 0; i < numIncompatibilities && possiblePairs.length > 0; i++) {
    const [potion1Id, potion2Id] = possiblePairs.pop()!;
    const potion1 = potions[potion1Id];
    const potion2 = potions[potion2Id];
    
    potion1.incompatibleWith.push(potion2Id);
    potion2.incompatibleWith.push(potion1Id);
    incompatibilityGroups.push([potion1Id + 1, potion2Id + 1]);
  }

  const levelInfo = {
    chemicals: numPotions,
    rooms: numRooms,
    groups: incompatibilityGroups.length,
    incompatibleGroups: incompatibilityGroups,
    potionDetails: potions.map(p => ({
      id: p.id,
      type: p.type,
      name: p.name,
      incompatibleWith: p.incompatibleWith
    }))
  };

  await fetchBestSolution(numRooms, potions.length, numIncompatibilities, incompatibilityGroups)
  .then(bestSolution => {
    solution = bestSolution;  
  })
  .catch(error => {
    console.error('Error getting best solution:', error);
  });

  return {
    potions,
    roomCount: numRooms,
    levelInfo
  };
};


export default function Home() {
  const [potions, setPotions] = useState<Potion[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [conflicts, setConflicts] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [draggingPotion, setDraggingPotion] = useState<number | null>(null);
  const [draggingFromRoom, setDraggingFromRoom] = useState<number | null>(null);
  const [incompatibilityList, setIncompatibilityList] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [showBestSolution, setShowBestSolution] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    window.level = level;
    initializeLevel(level);
  }, [level]);

  useEffect(() => {
    // Always show the tutorial when the page loads
    setShowHowToPlay(true);
    // No need to check or set localStorage since we want to show it every time
  }, []);

  useEffect(() => {
    
    const allPotionsAssigned = potions.every(potion => 
      rooms.some(room => room.potions.includes(potion.id))
    );
    setIsComplete(allPotionsAssigned);
  }, [rooms, potions]);

  const HowToPlayModal = () => {
    if (!showHowToPlay) return null;

    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2 className={styles.modalTitle}>How to Play - Potion Room Puzzle</h2>
          
          <p className={styles.modalText}>
            Welcome to the Potion Room Puzzle! Your task is to arrange magical potions into different rooms while avoiding dangerous combinations.
          </p>

          <h3 className={styles.modalTitle}>Game Rules:</h3>
          <ul className={styles.modalList}>
            <li>Drag and drop potions into different rooms</li>
            <li>Some potions are incompatible and can't be in the same room</li>
            <li>Try to find an arrangement with the least conflicts</li>
            <li>Each level gets progressively harder with:</li>
            <ul className={styles.modalList}>
              <li>More incompatible combinations</li>
              <li>Fewer available rooms</li>
              <li>Different potion types</li>
            </ul>
          </ul>

          <h3 className={styles.modalTitle}>Tips:</h3>
          <ul className={styles.modalList}>
            <li>Check incompatibilities before placing potions</li>
            <li>You can always see the best possible solution after trying</li>
            <li>Early levels are easier to help you learn</li>
            <li>After level 5, room count will vary between 2-3 for extra challenge</li>
          </ul>

          <button 
            className={styles.modalButton}
            onClick={() => setShowHowToPlay(false)}
          >
            Got it!
          </button>
        </div>
      </div>
    );
  };

  const HelpButton = () => (
    <button 
      className={styles.helpButton}
      onClick={() => setShowHowToPlay(true)}
      title="How to Play"
    >
      ?
    </button>
  );

  const handleDone = () => {
   
    const currentConflicts = conflicts;
    const bestConflicts = solution.leastAmountIncompatibilities;
    const score = Math.max(0, 100 - (currentConflicts - bestConflicts) * 20); 

    if (currentConflicts === bestConflicts) {
      alert(`Perfect Score! 🎉\nLevel ${level} completed!\nYou matched the best possible solution with ${currentConflicts} conflicts!\nScore: ${score}/100\n\nMoving to Level ${level + 1}`);
      setLevel(prev => prev + 1);
      setShowBestSolution(false);
    } else {
      const showSolution = window.confirm(`Level ${level}\nYour solution has ${currentConflicts} conflicts.\nBest possible solution has ${bestConflicts} conflicts.\nScore: ${score}/100\n\nWould you like to see the best solution?`);
      if (showSolution) {
        setShowBestSolution(true);
      }
    }
  };

  const displayBestSolution = () => {
    if (!showBestSolution) return null;

    const bestAssignment = solution.bestRoomAssignment.split(';')
      .filter(room => room.length > 0)
      .map(room => 
        room.split('')
          .map(Number)
          .filter(n => !isNaN(n)) 
          .map(n => n - 1) 
      )
      .filter(room => room.length > 0); 

    
    const assignedPotions = new Set(bestAssignment.flat());
    const allPotionsAssigned = potions.every(p => assignedPotions.has(p.id));
  

    return (
      <div className={styles.bestSolution}>
        <h3>Best Solution: {solution.leastAmountIncompatibilities} conflicts</h3>
        <div className={styles.bestRooms}>
          {bestAssignment.map((roomPotions, roomIndex) => (
            <div key={roomIndex} className={styles.bestRoom}>
              <h4>Room {roomIndex + 1}</h4>
              <div className={styles.bestPotions}>
                {roomPotions.map(potionId => {
                  const potion = potions.find(p => p.id === potionId);
                  return potion ? (
                    <div key={potionId} className={styles.bestPotion}>
                      {potion.type} {potion.name}
                    </div>
                  ) : (
                    <div key={potionId} className={styles.bestPotion}>
                      Invalid Potion ID: {potionId}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const initializeLevel = async (level: number) => {
    const levelConfig = await generateRandomLevel();
    setPotions(levelConfig.potions);
    setRooms(Array.from({ length: levelConfig.roomCount }, (_, i) => ({ 
      id: i, 
      potions: [] 
    })));
    setConflicts(0);
    updateIncompatibilityList(levelConfig.potions);
    
   
  };

  const updateIncompatibilityList = (potions: Potion[]) => {
    const incompatibilities = new Set<string>();
    potions.forEach(potion => {
      potion.incompatibleWith.forEach(incompatibleId => {
        const incompatiblePotion = potions.find(p => p.id === incompatibleId);
        if (incompatiblePotion) {
          const pair = [potion, incompatiblePotion].sort((a, b) => a.id - b.id);
          incompatibilities.add(`${pair[0].type} ${pair[0].name} + ${pair[1].type} ${pair[1].name}`);
        }
      });
    });
    setIncompatibilityList(Array.from(incompatibilities));
  };

  const calculateConflicts = (rooms: Room[]) => {
    let totalConflicts = 0;
    
    rooms.forEach(room => {
      
      room.potions.forEach((potionId, i) => {
        const potion = potions.find(p => p.id === potionId);
        if (!potion) return;
        
        
        room.potions.forEach((otherPotionId, j) => {
          if (i !== j && potion.incompatibleWith.includes(otherPotionId)) {
            totalConflicts++;
          }
        });
      });
    });

    return Math.floor(totalConflicts / 2); 
  };

  const handleDragStart = (e: React.DragEvent, potionId: number, fromRoomId?: number) => {
    setDraggingPotion(potionId);
    setDraggingFromRoom(fromRoomId ?? null);
    e.dataTransfer.setData('text/plain', potionId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.dragOver);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove(styles.dragOver);
  };

  const handleDrop = (e: React.DragEvent, roomId: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragOver);
    
    if (draggingPotion === null) return;

    const newRooms = [...rooms];
    
    const isInAnotherRoom = newRooms.some(room => 
      room.id !== draggingFromRoom && room.potions.includes(draggingPotion)
    );
    if (isInAnotherRoom && draggingFromRoom === null) {
      return;
    }

    // If dragging from a room, remove from that room
    if (draggingFromRoom !== null) {
      const oldRoom = newRooms.find(room => room.id === draggingFromRoom);
      if (oldRoom) {
        oldRoom.potions = oldRoom.potions.filter(id => id !== draggingPotion);
      }
    }

    // Add to new room
    const targetRoom = newRooms.find(room => room.id === roomId);
    if (targetRoom) {
      targetRoom.potions.push(draggingPotion);
      setConflicts(calculateConflicts(newRooms));
    }

    setRooms(newRooms);
    setDraggingPotion(null);
    setDraggingFromRoom(null);
  };

  const handlePotionTrayDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragOver);

    if (draggingFromRoom !== null && draggingPotion !== null) {
      const newRooms = [...rooms];
      const oldRoom = newRooms.find(room => room.id === draggingFromRoom);
      if (oldRoom) {
        oldRoom.potions = oldRoom.potions.filter(id => id !== draggingPotion);
        setRooms(newRooms);
        setConflicts(calculateConflicts(newRooms));
      }
    }

    setDraggingPotion(null);
    setDraggingFromRoom(null);
  };

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <h1>Potion Room Puzzle - Level {level}</h1>
      </div>

      <HowToPlayModal />
      <HelpButton />

      <div className={styles.center}>
        <div className={styles.gameContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Potion Puzzle</h1>
            <div className={styles.stats}>
              <p>Level: {level}</p>
              <p>Conflicts: {conflicts}</p>
              <button 
                className={styles.newGameButton}
                onClick={() => initializeLevel(level)}
              >
                New Game
              </button>
            </div>
            <div className={styles.instructions}>
              <p>Incompatible Potions:</p>
              <ul>
                {incompatibilityList.map((pair, index) => (
                  <li key={index}>{pair}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className={styles.gameBoard}>
            <div className={styles.rooms}>
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={styles.room}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, room.id)}
                >
                  <div className={styles.roomNumber}>{room.id + 1}</div>
                  <div className={styles.potionsInRoom}>
                    {room.potions.map(potionId => {
                      const potion = potions.find(p => p.id === potionId);
                      if (!potion) return null;
                      
                      const hasConflicts = room.potions.some(
                        otherId => otherId !== potionId && potion.incompatibleWith.includes(otherId)
                      );

                      return (
                        <div
                          key={potion.id}
                          className={`${styles.placedPotion} ${hasConflicts ? styles.conflict : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, potion.id, room.id)}
                        >
                          <div className={styles.potionContent}>
                            <span className={styles.potionEmoji}>{potion.type}</span>
                            <span className={styles.potionName}>{potion.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {showBestSolution && displayBestSolution()}

            <div className={styles.potionTrayContainer}>
              <div 
                className={styles.potions}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handlePotionTrayDrop}
              >
                {potions.map((potion) => {
                  const isAssigned = rooms.some(room => room.potions.includes(potion.id));
                  
                  return (
                    <div
                      key={potion.id}
                      className={`${styles.potion} 
                        ${draggingPotion === potion.id ? styles.dragging : ''} 
                        ${isAssigned ? styles.assigned : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, potion.id)}
                    >
                      <div className={styles.potionContent}>
                        <span className={styles.potionEmoji}>{potion.type}</span>
                        <span className={styles.potionName}>{potion.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {isComplete && (
                <button 
                  className={`${styles.doneButton} ${conflicts === 0 ? styles.success : ''}`}
                  onClick={handleDone}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

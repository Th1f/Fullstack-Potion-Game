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
  potions: number[]; // Array of potion IDs in this room
}

interface BestSolution{
  numRooms: number;
  numPotions: number;
  numIncompatibilities: number;
  incompatibilities: number[][];
}

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

    const response = await fetch(`http://localhost:8080/api?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch best solution');
    }

    const data = await response.json();
    console.log('Received data:', data);
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
  { type: '⚡', name: 'Speed' },
  { type: '🌟', name: 'Magic' },
  { type: '🔥', name: 'Fire' },
  { type: '❄️', name: 'Ice' },
  { type: '⚔️', name: 'Battle' },
] as const;

const generateRandomLevel = () => {
  // Random number of potions (4-8)
  const numPotions = Math.floor(Math.random() * 5) + 4;
  // Random number of rooms (2-4)
  const numRooms = Math.floor(Math.random() * 3) + 2;
  // Random number of incompatibilities
  const numIncompatibilities = Math.floor(Math.random() * 3) + 2;

 
  // Randomly select potions
  const shuffledPotions = [...POTION_TYPES]
    .sort(() => Math.random() - 0.5)
    .slice(0, numPotions);

  // Generate potions with random incompatibilities
  const potions: Potion[] = shuffledPotions.map((potion, index) => ({
    id: index + 1,
    ...potion,
    incompatibleWith: [], // Initialize empty, will be filled later
  }));

  // Add random incompatibilities
  const incompatibilityGroups: number[][] = [];
  potions.forEach((potion) => {
    const numIncompatibilities = Math.floor(Math.random() * 2) + 2;
    const possibleIncompatibilities = potions
      .filter(p => p.id !== potion.id && !potion.incompatibleWith.includes(p.id))
      .map(p => p.id);
    for (let i = 0; i < numIncompatibilities && possibleIncompatibilities.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * possibleIncompatibilities.length);
      const incompatibleId = possibleIncompatibilities.splice(randomIndex, 1)[0];
      potion.incompatibleWith.push(incompatibleId);
      const otherPotion = potions.find(p => p.id === incompatibleId);
      if (otherPotion) {
        otherPotion.incompatibleWith.push(potion.id);
        incompatibilityGroups.push([potion.id, incompatibleId].sort((a, b) => a - b));
      }
    }
  });
  console.log('Incompatibility groups:', incompatibilityGroups);

  fetchBestSolution(numRooms, numPotions, numIncompatibilities, incompatibilityGroups)
  .then(bestSolution => {
    console.log('Best solution:', bestSolution);
    // Use bestSolution data here
  })
  .catch(error => {
    console.error('Error getting best solution:', error);
  });


  // Create level info JSON
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

  // Log the level info
  console.log('Level Information:', JSON.stringify(levelInfo, null, 2));

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

  useEffect(() => {
    initializeLevel(level);
  }, [level]);

  useEffect(() => {
    // Check if all potions are assigned
    const allPotionsAssigned = potions.every(potion => 
      rooms.some(room => room.potions.includes(potion.id))
    );
    setIsComplete(allPotionsAssigned);
  }, [rooms, potions]);

  const handleDone = () => {
    if (conflicts === 0) {
      alert('Congratulations! You solved the puzzle with no conflicts! 🎉\nTry another level?');
      setLevel(prev => prev + 1);
    } else {
      alert(`You have ${conflicts} conflicts. Try to reduce them to 0!`);
    }
  };

  const initializeLevel = async (level: number) => {
    const levelConfig = generateRandomLevel();
    setPotions(levelConfig.potions);
    setRooms(Array.from({ length: levelConfig.roomCount }, (_, i) => ({ 
      id: i, 
      potions: [] 
    })));
    setConflicts(0);
    updateIncompatibilityList(levelConfig.potions);
    
    // Save level information
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
      // Check conflicts within the same room
      room.potions.forEach((potionId, i) => {
        const potion = potions.find(p => p.id === potionId);
        if (!potion) return;
        
        // Check against other potions in the same room
        room.potions.forEach((otherPotionId, j) => {
          if (i !== j && potion.incompatibleWith.includes(otherPotionId)) {
            totalConflicts++;
          }
        });
      });
    });

    return Math.floor(totalConflicts / 2); // Divide by 2 as each conflict is counted twice
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
    
    // Check if potion is already in any room (except the room we're dragging from)
    const isInAnotherRoom = newRooms.some(room => 
      room.id !== draggingFromRoom && room.potions.includes(draggingPotion)
    );

    // If potion is in another room and we're dragging from the potion tray, don't allow the drop
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
    </main>
  );
}

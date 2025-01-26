import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import io from 'socket.io-client';

const App = () => {
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const socket = io('http://localhost:3001'); // Connect to the server

  // Set up the Three.js scene
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    const animate = function () {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    socket.on('playerMoved', (data) => {
      // Update the player's position when other players move
      setPlayerPosition({ x: data.x, y: data.y, z: data.z });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Function to send movement data to the server
  const movePlayer = (dx, dy, dz) => {
    const newPosition = {
      x: playerPosition.x + dx,
      y: playerPosition.y + dy,
      z: playerPosition.z + dz,
    };

    // Emit the player move event to the server
    socket.emit('playerMove', newPosition);

    // Update the player position locally (client-side)
    setPlayerPosition(newPosition);
  };

  // Handling key press events to move the player
  useEffect(() => {
    const handleKeyDown = (event) => {
      const speed = 0.5;  // Increased speed

      if (!isMoving) {
        setIsMoving(true);
        switch (event.key) {
          case 'w': // Move forward
            movePlayer(0, speed, 0);
            break;
          case 's': // Move backward
            movePlayer(0, -speed, 0);
            break;
          case 'a': // Move left
            movePlayer(-speed, 0, 0);
            break;
          case 'd': // Move right
            movePlayer(speed, 0, 0);
            break;
          default:
            break;
        }
      }
    };

    const handleKeyUp = (event) => {
      // Reset movement status when key is released
      setIsMoving(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerPosition, isMoving]);

  return (
    <div>
      <h1>MMORPG</h1>
      <p>Player Position: ({playerPosition.x.toFixed(2)}, {playerPosition.y.toFixed(2)}, {playerPosition.z.toFixed(2)})</p>
    </div>
  );
};

export default App;
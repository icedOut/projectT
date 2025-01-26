import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import * as THREE from 'three';

const App = () => {
  const [userName, setUserName] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isValidName, setIsValidName] = useState(false);
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const socket = useRef(null);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const usersRefs = useRef({}); // To store 3D objects for each user

  const userPosition = useRef({ x: 0, y: 0, z: 0 });

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserName(value);
    setIsValidName(value.length >= 3);
  };

  const handleNameSubmit = () => {
    if (isValidName && socket.current) {
      socket.current.emit('setName', userName);
      setIsNameSubmitted(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isValidName) {
      e.preventDefault();
      handleNameSubmit();
    }
  };

  const handleMovement = (e) => {
    const moveSpeed = 0.1;

    // Update the user position based on the key pressed
    if (e.key === 'w' || e.key === 'ArrowUp') {
      userPosition.current.z -= moveSpeed;
    } else if (e.key === 's' || e.key === 'ArrowDown') {
      userPosition.current.z += moveSpeed;
    } else if (e.key === 'a' || e.key === 'ArrowLeft') {
      userPosition.current.x -= moveSpeed;
    } else if (e.key === 'd' || e.key === 'ArrowRight') {
      userPosition.current.x += moveSpeed;
    }

    // Emit the updated position to the server
    if (socket.current) {
      socket.current.emit('move', userPosition.current);
    }
  };

  useEffect(() => {
    // Initialize socket connection
    socket.current = io('http://localhost:3001', {
      withCredentials: true
    });

    socket.current.on('connect', () => {
      console.log('Socket connected:', socket.current.id);
    });

    socket.current.on('userList', (users) => {
      console.log('Updated user list from server:', users);
      setConnectedUsers(users);

      users.forEach((user) => {
        if (!usersRefs.current[user.id]) {
          const geometry = new THREE.SphereGeometry(0.5);
          const material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
          const sphere = new THREE.Mesh(geometry, material);

          const x = user.x != null ? user.x : 0;
          const z = user.z != null ? user.z : 0;
          sphere.position.set(x, 0.5, z);

          sceneRef.current.add(sphere);
          usersRefs.current[user.id] = sphere;
        } else {
          const x = user.x != null ? user.x : 0;
          const z = user.z != null ? user.z : 0;
          usersRefs.current[user.id].position.set(x, 0.5, z);
        }
      });

      Object.keys(usersRefs.current).forEach((userId) => {
        if (!users.find((user) => user.id === userId)) {
          sceneRef.current.remove(usersRefs.current[userId]);
          delete usersRefs.current[userId];
        }
      });
    });

    return () => {
      if (socket.current) {
        console.log('Disconnecting socket...');
        socket.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const light = new THREE.AmbientLight(0x404040);
    scene.add(light);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleMovement);

    return () => {
      window.removeEventListener('keydown', handleMovement);
    };
  }, []);

  return (
    <div>
      {!isNameSubmitted ? (
        <div>
          <h1>Enter Your Name (Min 3 characters)</h1>
          <input
            type="text"
            value={userName}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Enter your name"
            autoFocus
          />
          <button onClick={handleNameSubmit} disabled={!isValidName}>
            Submit
          </button>
          {!isValidName && userName.length > 0 && (
            <p style={{ color: 'red' }}>Name must be at least 3 characters long.</p>
          )}
        </div>
      ) : (
        <div>
          <h1>Welcome, {userName}!</h1>
          <h2>Connected Users:</h2>
          <ul>
            {connectedUsers.length > 0 ? (
              connectedUsers.map((user) => <li key={user.id}>{user.name}</li>)
            ) : (
              <p>No users connected.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;

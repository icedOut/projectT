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
  const usersRefs = useRef({});

  // Handle input change for username
  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserName(value);
    setIsValidName(value.length >= 3);
  };

  // Handle name submit button click
  const handleNameSubmit = () => {
    if (isValidName && socket.current) {
      socket.current.emit('setName', userName);
      setIsNameSubmitted(true);
    }
  };

  // Handle key press for Enter submission
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isValidName) {
      e.preventDefault();
      handleNameSubmit();
    }
  };

  useEffect(() => {
    // Initialize socket connection
    socket.current = io('http://localhost:3001');
    
    // Log when the socket connects
    socket.current.on('connect', () => {
      console.log('Socket connected:', socket.current.id);
    });

    // Handle updated user list
    socket.current.on('userList', (users) => {
      console.log('Updated users list received:', users);
      setConnectedUsers(users);

      // Add or remove Three.js spheres based on the updated user list
      users.forEach((user, index) => {
        if (!usersRefs.current[user.id]) {
          const geometry = new THREE.SphereGeometry(0.5);
          const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(index * 2 - users.length, 0, 0);
          sceneRef.current.add(sphere);
          usersRefs.current[user.id] = sphere;
        }
      });

      // Remove Three.js spheres for disconnected users
      Object.keys(usersRefs.current).forEach((userId) => {
        if (!users.find((user) => user.id === userId)) {
          sceneRef.current.remove(usersRefs.current[userId]);
          delete usersRefs.current[userId];
        }
      });
    });

    // Clean up on component unmount
    return () => {
      if (socket.current) {
        console.log('Disconnecting socket...');
        socket.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Set up Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Clean up Three.js scene and renderer on component unmount
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      document.body.removeChild(renderer.domElement);
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

// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import FaceDetection from './FaceDetection';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FaceDetection />} />
      </Routes>
    </Router>
  );
}

export default App;

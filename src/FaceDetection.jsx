// src/FaceDetection.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { FaceMesh } from '@mediapipe/face_mesh';

const FaceDetection = () => {
  const videoRef = useRef(null);
  const [gazeStatus, setGazeStatus] = useState('');

  const setupCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    return new Promise((resolve) => {
      videoRef.current.onloadedmetadata = () => resolve(videoRef.current);
    });
  };

  const detectGazeAndExpressions = async () => {
    await setupCamera();
    videoRef.current.play();

    const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
    faceMesh.setOptions({ maxNumFaces: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Check if landmarks are defined
        if (!landmarks || landmarks.length < 474) {
          console.error("Landmarks are not properly detected");
          return;
        }

        // Extract landmarks for eyes and chin
        const noseTip = landmarks[1]; // Nose tip
        const leftEyeUpper = landmarks[159]; // Left eye upper bound
        const leftEyeLower = landmarks[145]; // Left eye lower bound
        const rightEyeUpper = landmarks[386]; // Right eye upper bound
        const rightEyeLower = landmarks[374]; // Right eye lower bound
        const leftPupil = landmarks[468]; // Left pupil approximation
        const rightPupil = landmarks[473]; // Right pupil approximation
        
        // Ensure all required landmarks are defined
        if (!noseTip || !leftEyeUpper || !leftEyeLower || !rightEyeUpper || !rightEyeLower || !leftPupil || !rightPupil) {
          console.error("One or more required facial landmarks are undefined");
          return;
        }

        const chinY = landmarks[152]?.y; // Chin position

        // Ensure chinY is defined
        if (chinY === undefined) {
          console.error("Chin landmark is undefined");
          return;
        }

        // Calculate ratios for both eyes
        const leftRatio = (leftPupil.y - leftEyeUpper.y) / (leftEyeLower.y - leftEyeUpper.y);
        const rightRatio = (rightPupil.y - rightEyeUpper.y) / (rightEyeLower.y - rightEyeUpper.y);

        // Determine head tilt using chin and nose position
        const isHeadTiltedDown = chinY > noseTip.y;

        // Determine gaze direction
        if (leftRatio > 0.75 && rightRatio > 0.75 && isHeadTiltedDown) {
          setGazeStatus('Looking down');
          console.log('Looking down');
        } else {
          setGazeStatus('Looking at the screen');
          console.log('Looking at the screen');
        }
      } else {
        console.log('No faces detected');
      }
    });

    const detect = async () => {
      await faceMesh.send({ image: videoRef.current });
      requestAnimationFrame(detect);
    };

    detect();
  };

  useEffect(() => {
    detectGazeAndExpressions();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <video ref={videoRef} className="w-full h-auto" autoPlay muted />
      <h2 className="mt-4 text-xl font-bold">{gazeStatus}</h2>
    </div>
  );
};

export default FaceDetection;

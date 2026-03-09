import * as faceapi from 'face-api.js';

// Load models
let modelsLoaded = false;

export const loadFaceApiModels = async () => {
  if (modelsLoaded) return true;
  
  try {
    // Try multiple CDN sources
    const MODEL_URLS = [
      'https://justadudewhohacks.github.io/face-api.js/models',
      'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
      '/models' // Local folder if you have models downloaded
    ];
    
    let loaded = false;
    let lastError = null;
    
    for (const MODEL_URL of MODEL_URLS) {
      try {
        console.log(`Attempting to load models from: ${MODEL_URL}`);
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        
        loaded = true;
        console.log(`Models loaded successfully from: ${MODEL_URL}`);
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Failed to load from ${MODEL_URL}:`, err);
      }
    }
    
    if (!loaded) {
      console.error('Failed to load models from all sources:', lastError);
      return false;
    }
    
    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading face detection models:', error);
    return false;
  }
};


// In your detection functions, add options with score threshold
export const detectFace = async (videoElement: HTMLVideoElement) => {
  try {
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 512,
      scoreThreshold: 0.5
    });
    
    const detection = await faceapi
      .detectSingleFace(videoElement, options)
      .withFaceLandmarks();
    
    // Add null check for detection and detection.detection
    if (!detection || !detection.detection) {
      return null;
    }
    
    return detection;
  } catch (error) {
    console.error('Face detection error:', error);
    return null;
  }
};

// Update checkHeadTurn function
export const checkHeadTurn = async (
  videoElement: HTMLVideoElement, 
  direction: 'left' | 'right'
): Promise<boolean> => {
  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    
    if (!detection || !detection.landmarks) return false;
    
    const landmarks = detection.landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    
    // Add null/empty checks
    if (!leftEye || !rightEye || !nose || leftEye.length === 0 || rightEye.length === 0 || nose.length === 0) {
      return false;
    }
    
    // Calculate head rotation based on eye positions
    const leftEyeCenter = {
      x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
      y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
    };
    
    const rightEyeCenter = {
      x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
      y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
    };
    
    const noseTip = nose[3]; // Tip of the nose
    
    if (!noseTip) return false;
    
    // Determine head turn
    const eyeDistance = rightEyeCenter.x - leftEyeCenter.x;
    if (eyeDistance === 0) return false;
    
    const noseOffsetFromCenter = noseTip.x - (leftEyeCenter.x + eyeDistance / 2);
    
    // Normalize the offset
    const normalizedOffset = noseOffsetFromCenter / (eyeDistance / 2);
    
    if (direction === 'left') {
      return normalizedOffset < -0.3; // Turned left enough
    } else {
      return normalizedOffset > 0.3; // Turned right enough
    }
  } catch (error) {
    console.error('Head turn detection error:', error);
    return false;
  }
};

// Update checkSmile function
export const checkSmile = async (videoElement: HTMLVideoElement): Promise<boolean> => {
  try {
    const expression = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();
    
    if (!expression || !expression.expressions) return false;
    
    // Check if happy expression is strong enough
    return (expression.expressions.happy || 0) > 0.7;
  } catch (error) {
    console.error('Smile detection error:', error);
    return false;
  }
};

// Update checkTongueOut function
export const checkTongueOut = async (videoElement: HTMLVideoElement): Promise<boolean> => {
  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    
    if (!detection || !detection.landmarks) return false;
    
    const landmarks = detection.landmarks;
    const mouth = landmarks.getMouth();
    
    if (!mouth || mouth.length === 0) return false;
    
    // Calculate mouth openness
    const topLip = mouth[13];
    const bottomLip = mouth[19];
    
    if (!topLip || !bottomLip) return false;
    
    const mouthOpenness = Math.abs(bottomLip.y - topLip.y);
    
    // Calculate mouth width for reference
    const leftMouth = mouth[12];
    const rightMouth = mouth[16];
    
    if (!leftMouth || !rightMouth) return false;
    
    const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
    
    // If mouth is significantly open (more than 30% of width), consider it as "tongue out"
    return mouthOpenness > mouthWidth * 0.3;
  } catch (error) {
    console.error('Tongue detection error:', error);
    return false;
  }
};

// Update checkHeadShake function
export const checkHeadShake = async (
  videoElement: HTMLVideoElement,
  previousPositions: { x: number; y: number }[]
): Promise<{ detected: boolean; positions: { x: number; y: number }[] }> => {
  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    
    if (!detection || !detection.detection) {
      return { detected: false, positions: previousPositions };
    }
    
    const box = detection.detection.box;
    
    // Add null check for box properties
    if (!box || box.x === undefined || box.y === undefined || box.width === undefined || box.height === undefined) {
      return { detected: false, positions: previousPositions };
    }
    
    const currentPosition = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    
    // Keep last 10 positions
    const updatedPositions = [...previousPositions, currentPosition].slice(-10);
    
    // Check if we have enough positions
    if (updatedPositions.length < 10) {
      return { detected: false, positions: updatedPositions };
    }
    
    // Calculate movement variance
    const xPositions = updatedPositions.map(p => p.x);
    const meanX = xPositions.reduce((a, b) => a + b, 0) / xPositions.length;
    const variance = xPositions.reduce((a, b) => a + Math.pow(b - meanX, 2), 0) / xPositions.length;
    
    // If variance is high, head is shaking
    const detected = variance > 100; // Threshold for shake detection
    
    return { detected, positions: updatedPositions };
  } catch (error) {
    console.error('Head shake detection error:', error);
    return { detected: false, positions: previousPositions };
  }
};
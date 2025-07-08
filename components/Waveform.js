import { useEffect, useRef, useState } from 'react';

const Waveform = ({ isPlaying, audioElements }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const peakLevelRef = useRef({ left: 0, right: 0 });
  const clipCountRef = useRef(0);
  const clipHoldRef = useRef(0);
  const warningFlashRef = useRef(0);
  const connectedSourcesRef = useRef(new Set());
  const sumGainRef = useRef(null);

  const initializeAudioContext = () => {
    if (!audioContextRef.current && audioElements.length > 0) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Create a gain node to sum all sources
      sumGainRef.current = audioContextRef.current.createGain();
      sumGainRef.current.gain.value = 1.0;
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024;
      analyserRef.current.smoothingTimeConstant = 0;
      analyserRef.current.minDecibels = -60;
      analyserRef.current.maxDecibels = 0;
      
      const bufferLength = analyserRef.current.fftSize;
      dataArrayRef.current = new Float32Array(bufferLength);
      
      // Connect the summed signal to the analyser
      sumGainRef.current.connect(analyserRef.current);
      
      setIsInitialized(true);
    }
  };
  
  const connectNewAudioSources = () => {
    if (audioContextRef.current && sumGainRef.current && audioElements.length > 0) {
      // Adjust gain to prevent clipping with multiple sources
      sumGainRef.current.gain.value = Math.max(0.5, 1.0 - (connectedSourcesRef.current.size * 0.05));
      
      // Connect only new audio elements
      audioElements.forEach((audio, index) => {
        if (!connectedSourcesRef.current.has(audio)) {
          try {
            const source = audioContextRef.current.createMediaElementSource(audio);
            source.connect(sumGainRef.current);
            source.connect(audioContextRef.current.destination);
            connectedSourcesRef.current.add(audio);
            console.log(`Connected new audio source ${index + 1}`);
          } catch (e) {
            console.log('Audio source already connected:', e);
          }
        }
      });
    }
  };

  const drawPeakMeter = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw meter frame
    const meterHeight = height * 0.7;
    const meterY = (height - meterHeight) / 2;
    const meterWidth = width * 0.85;
    const meterX = (width - meterWidth) / 2;
    
    // Decrement warning flash counter
    if (warningFlashRef.current > 0) {
      warningFlashRef.current--;
    }
    
    // Meter background (flash red when clipping)
    if (warningFlashRef.current > 0) {
      const flashIntensity = warningFlashRef.current / 20;
      const redValue = Math.floor(255 * flashIntensity * 0.3);
      const flashColor = `rgb(${redValue}, 0, 0)`;
      
      ctx.fillStyle = flashColor;
      ctx.fillRect(0, 0, width, height);
    }
    
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    
    // Draw dB scale
    ctx.font = '10px monospace';
    ctx.fillStyle = '#946928';
    const dbScale = [-60, -40, -20, -12, -6, -3, 0];
    dbScale.forEach((db) => {
      const x = meterX + ((db + 60) / 60) * meterWidth;
      ctx.textAlign = 'center';
      ctx.fillText(db, x, meterY - 8);
      
      // Scale lines
      ctx.strokeStyle = db === 0 ? '#8a3a3a' : '#946928';
      ctx.lineWidth = db === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, meterY);
      ctx.lineTo(x, meterY + 5);
      ctx.stroke();
    });
    
    // Get peak level
    let peakDb = -60;
    let isClipping = false;
    
    if (isPlaying && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
      
      // Find peak sample
      let peak = 0;
      let sumSquares = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const sample = Math.abs(dataArrayRef.current[i]);
        if (sample > peak) peak = sample;
        sumSquares += sample * sample;
      }
      
      // Calculate RMS for better multi-source detection
      const rms = Math.sqrt(sumSquares / dataArrayRef.current.length);
      
      // Use RMS-based peak for multiple sources
      const sourceCount = connectedSourcesRef.current.size;
      if (sourceCount > 1) {
        peak = Math.max(peak, rms * 2.5);
      }
      
      // Check for clipping - lower threshold for multiple sources
      const clipThreshold = Math.max(0.85, 0.99 - (sourceCount * 0.02));
      if (peak >= clipThreshold || (sourceCount >= 3 && peak >= 0.85)) {
        isClipping = true;
        clipCountRef.current++;
        clipHoldRef.current = 60; // Hold clip indicator for 1 second
        warningFlashRef.current = 20; // Flash warning
      }
      
      // Convert to dB
      peakDb = 20 * Math.log10(Math.max(0.0001, peak));
      peakDb = Math.max(-60, Math.min(0, peakDb));
    }
    
    // Update peak level with fast attack, slow release
    const targetLevel = (peakDb + 60) / 60;
    const currentLevel = peakLevelRef.current.left;
    const attackTime = 0.95; // Fast attack
    const releaseTime = 0.02; // Slow release
    
    if (targetLevel > currentLevel) {
      peakLevelRef.current.left = currentLevel + (targetLevel - currentLevel) * attackTime;
    } else {
      peakLevelRef.current.left = currentLevel + (targetLevel - currentLevel) * releaseTime;
    }
    
    // Draw meter bars
    const barHeight = meterHeight * 0.6;
    const barY = meterY + (meterHeight - barHeight) / 2;
    
    // Main meter bar
    const meterLevel = peakLevelRef.current.left;
    const meterFillWidth = meterLevel * meterWidth;
    
    // Gradient based on level (muted colors)
    const gradient = ctx.createLinearGradient(meterX, 0, meterX + meterWidth, 0);
    gradient.addColorStop(0, '#4a6741');
    gradient.addColorStop(0.5, '#4a6741');
    gradient.addColorStop(0.7, '#7a7a3a');
    gradient.addColorStop(0.85, '#8a5a2a');
    gradient.addColorStop(0.95, '#8a3a3a');
    gradient.addColorStop(1, '#8a3a3a');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(meterX, barY, meterFillWidth, barHeight);
    
    // Peak hold line
    ctx.strokeStyle = '#d0d0c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(meterX + meterFillWidth, barY - 5);
    ctx.lineTo(meterX + meterFillWidth, barY + barHeight + 5);
    ctx.stroke();
    
    // Page background flash on clipping
    if (clipHoldRef.current > 0) {
      clipHoldRef.current--;
      
      // Flash entire page background red
      if (warningFlashRef.current > 0) {
        const flashIntensity = warningFlashRef.current / 20;
        const redValue = Math.floor(255 * flashIntensity * 0.3);
        const flashColor = `rgb(${redValue}, 0, 0)`;
        
        const container = document.querySelector('.container');
        if (container) {
          container.style.backgroundColor = flashColor;
        }
      } else {
        const container = document.querySelector('.container');
        if (container) {
          container.style.backgroundColor = '#0a0a0a';
        }
      }
    }
    
    
    // Labels
    ctx.fillStyle = '#946928';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PEAK METER', width/2, meterY - 25);
    
  };
  
  const animate = () => {
    drawPeakMeter();
    animationRef.current = requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    
    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = 140;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    if (audioElements.length > 0 && !isInitialized) {
      initializeAudioContext();
    }
  }, [audioElements.length, isInitialized]);
  
  useEffect(() => {
    if (isInitialized && audioElements.length > 0) {
      connectNewAudioSources();
    }
  }, [audioElements, isInitialized]);
  
  useEffect(() => {
    if (isInitialized || !isPlaying) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isInitialized]);
  
  // Reset clip counter when stopped
  useEffect(() => {
    if (!isPlaying) {
      clipCountRef.current = 0;
      clipHoldRef.current = 0;
      warningFlashRef.current = 0;
      connectedSourcesRef.current.clear();
      // Reset page background
      const container = document.querySelector('.container');
      if (container) {
        container.style.backgroundColor = '#0a0a0a';
      }
    }
  }, [isPlaying]);
  
  return (
    <div className="waveform-container peak-meter">
      <canvas ref={canvasRef} className="waveform-canvas" />
    </div>
  );
};

export default Waveform;
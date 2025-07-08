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
    
    // Background with warning flash
    if (warningFlashRef.current > 0) {
      const flashIntensity = warningFlashRef.current / 20;
      ctx.fillStyle = `rgba(255, 0, 0, ${flashIntensity * 0.2})`;
      ctx.fillRect(0, 0, width, height);
      warningFlashRef.current--;
    }
    
    // Meter background
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    
    // Draw dB scale
    ctx.font = '10px monospace';
    ctx.fillStyle = '#888';
    const dbScale = [-60, -40, -20, -12, -6, -3, 0];
    dbScale.forEach((db) => {
      const x = meterX + ((db + 60) / 60) * meterWidth;
      ctx.textAlign = 'center';
      ctx.fillText(db, x, meterY - 8);
      
      // Scale lines
      ctx.strokeStyle = db === 0 ? '#ff0000' : '#444';
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
    
    // Gradient based on level
    const gradient = ctx.createLinearGradient(meterX, 0, meterX + meterWidth, 0);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(0.7, '#ffff00');
    gradient.addColorStop(0.85, '#ff8800');
    gradient.addColorStop(0.95, '#ff0000');
    gradient.addColorStop(1, '#ff0000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(meterX, barY, meterFillWidth, barHeight);
    
    // Peak hold line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(meterX + meterFillWidth, barY - 5);
    ctx.lineTo(meterX + meterFillWidth, barY + barHeight + 5);
    ctx.stroke();
    
    // Clipping indicator
    if (clipHoldRef.current > 0) {
      clipHoldRef.current--;
      
      // Red CLIP box
      const clipX = meterX + meterWidth + 20;
      const clipY = meterY + 10;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(clipX, clipY, 50, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CLIP', clipX + 25, clipY + 22);
      
      // Distortion warning
      if (connectedSourcesRef.current.size > 3) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EXTREME DISTORTION!', width/2, height - 10);
      }
    }
    
    // Clip counter
    if (clipCountRef.current > 0) {
      ctx.fillStyle = '#ff6600';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Clips: ${clipCountRef.current}`, meterX + meterWidth, meterY + meterHeight + 20);
    }
    
    // Labels
    ctx.fillStyle = '#ccc';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PEAK METER', width/2, meterY - 25);
    
    // Audio source counter
    const sourceCount = connectedSourcesRef.current.size;
    ctx.fillStyle = sourceCount > 5 ? '#ff0000' : '#888';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Sources: ${sourceCount}`, meterX, meterY + meterHeight + 20);
    
    // Chaos level indicator
    if (sourceCount > 0) {
      const chaosLevel = Math.min(sourceCount / 10, 1);
      const chaosText = 
        sourceCount >= 10 ? 'MAXIMUM CHAOS' :
        sourceCount >= 5 ? 'HIGH CHAOS' :
        sourceCount >= 3 ? 'MODERATE CHAOS' : 'LOW CHAOS';
      
      ctx.fillStyle = 
        sourceCount >= 10 ? '#ff0000' :
        sourceCount >= 5 ? '#ff8800' :
        sourceCount >= 3 ? '#ffff00' : '#00ff00';
      
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(chaosText, width/2, meterY + meterHeight + 20);
    }
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
    }
  }, [isPlaying]);
  
  return (
    <div className="waveform-container peak-meter">
      <canvas ref={canvasRef} className="waveform-canvas" />
    </div>
  );
};

export default Waveform;
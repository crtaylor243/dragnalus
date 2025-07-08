import { useEffect, useRef } from 'react';

const Waveform = ({ isPlaying, audioCount }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  const drawWaveform = (amplitude = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = 4;
    const barGap = 2;
    const barCount = Math.floor(width / (barWidth + barGap));
    const centerY = height / 2;
    
    ctx.fillStyle = '#95682a';
    
    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + barGap);
      // Base height increases with more audio files
      const baseHeight = isPlaying ? 10 + (audioCount * 2) : 5;
      const randomVariation = Math.random() * 30;
      const barHeight = isPlaying ? baseHeight + (amplitude * randomVariation) : 5;
      
      ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
    }
  };
  
  const animate = () => {
    if (!isPlaying) {
      drawWaveform(0);
      return;
    }
    
    const amplitude = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
    // Scale amplitude based on audio count, maxing out at 5
    const scaleFactor = Math.min(audioCount / 5, 1);
    drawWaveform(amplitude * scaleFactor);
    animationRef.current = requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    
    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = 80;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (isPlaying) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      drawWaveform(0);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioCount]);
  
  return (
    <div className="waveform-container">
      <canvas ref={canvasRef} className="waveform-canvas" />
    </div>
  );
};

export default Waveform;
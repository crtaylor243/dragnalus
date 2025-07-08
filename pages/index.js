import Head from 'next/head'
import {useState, useEffect, useRef} from "react";
import {pick} from "next/dist/lib/pick";
import Waveform from '../components/Waveform';

export default function Home() {
  const [musicCount, setmusicCount] = useState(0);
  const [musics, setMusics] = useState([]);
  const [image, setImage] = useState("");
  const [imageNumber, setImageNumber] = useState(1);
  const [visitorIndex, setVisitorIndex] = useState(Math.floor(Math.random()*3));
  const [isClipping, setIsClipping] = useState(false);
  const [tennisBalls, setTennisBalls] = useState([]);
  const [goodBoyMode, setGoodBoyMode] = useState(true);

  const visitorCounts = [69, 420, 666];
  const visitorCount = visitorCounts[visitorIndex];


  const checkImageExists = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  async function pickMedia() {
    const base = "drag-";
    const birthday = isBirthday() ? "-bday" : "";
    const num = imageNumber;

    // Try GIF first, then fallback to JPG
    const gifPath = base + num + birthday + ".gif";
    const jpgPath = base + num + birthday + ".jpg";
    
    const gifExists = await checkImageExists(gifPath);
    const newMedia = gifExists ? gifPath : jpgPath;
    
    // Only fade if the media is actually changing
    if (newMedia !== image) {
      const mediaElement = document.querySelector('.drag');
      if (mediaElement) {
        mediaElement.style.opacity = '0';
        setTimeout(() => {
          setImage(newMedia);
          mediaElement.style.opacity = '1';
        }, 150); // Half of the transition duration
      }
    }
  }

  function isBirthday() {
    const birthDate = new Date(2021, 7, 11);
    const today = new Date()
    return birthDate.getDate() === today.getDate() &&
        birthDate.getMonth() === today.getMonth();
  }

  async function resetMedia() {
    setImageNumber(1);
    const base = "drag-1";
    const birthday = isBirthday() ? "-bday" : "";
    const gifPath = base + birthday + ".gif";
    const jpgPath = base + birthday + ".jpg";
    
    const gifExists = await checkImageExists(gifPath);
    const media = gifExists ? gifPath : jpgPath;
    setImage(media);
  }

  function playMusic() {;
    let music = new Audio();
    music.pause();
    music = new Audio("/dragnalus_unwound.mp3");
    music.play();
    const newCount = musicCount + 1;
    setmusicCount(newCount);
    setMusics([...musics, music]);
    
    // Cycle through images 1-4
    const nextImageNumber = imageNumber >= 4 ? 4 : imageNumber + 1;
    setImageNumber(nextImageNumber);
    
    console.log("music count = ", newCount);
  }

  function stopMusic() {
    musics.forEach(m => m.pause());
    setMusics([]);
    setmusicCount(0);
    setTennisBalls([]); // Clear tennis balls

    resetMedia();
    console.log("music count = ", musicCount);
  }

  // Initialize default media on component mount
  useEffect(() => {
    resetMedia();
  }, []);

  // Update media when image number changes
  useEffect(() => {
    if (imageNumber > 1) {
      pickMedia();
    }
  }, [imageNumber]);

  // Handle tennis ball animation
  const handleClipping = (clippingState) => {
    setIsClipping(clippingState);
  };

  // Continuous ball spawning while clipping
  useEffect(() => {
    if (!isClipping) return;

    const spawnBalls = () => {
      // Spawn multiple balls per frame for maximum chaos
      for (let i = 0; i < 3; i++) {
        // Determine if this ball should bounce (90% chance)
        const shouldBounce = Math.random() < 0.9;
        
        // Get image bottom position to spawn balls below it
        const imgElement = document.querySelector('.drag');
        const imageBottom = imgElement ? imgElement.offsetTop + imgElement.offsetHeight + 50 : 300;

        const newBall = {
          id: Date.now() + Math.random() + i,
          x: Math.random() * 90 + 5, // Random position between 5% and 95%
          y: imageBottom, // Start below the image
          vx: Math.random() * 300 - 150, // Much higher horizontal velocity -150 to 150 px/s
          vy: Math.random() * 100 + 50, // Initial downward velocity 50 to 150 px/s
          rotation: 0,
          rotationSpeed: Math.random() * 720 - 360, // Faster rotation
          shouldBounce: shouldBounce,
          hasBounced: false,
          startTime: Date.now()
        };
        
        setTennisBalls(prev => [...prev, newBall]);
      }
    };

    const interval = setInterval(spawnBalls, 50); // Spawn every 50ms
    
    return () => clearInterval(interval);
  }, [isClipping]);

  // Physics animation for tennis balls
  useEffect(() => {
    let animationFrame;
    const gravity = 980; // px/s²
    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Get divider position (top of footer)
      const footerHeight = 200; // Fixed footer height
      const dividerY = window.innerHeight - footerHeight - 10;

      setTennisBalls(prev => prev.map(ball => {
        let newVy = ball.vy + gravity * deltaTime;
        let newY = ball.y + ball.vy * deltaTime + 0.5 * gravity * deltaTime * deltaTime;
        let newX = ball.x + (ball.vx / window.innerWidth * 100) * deltaTime; // Convert px to percentage
        let newHasBounced = ball.hasBounced;

        // Check for bounce on divider
        if (ball.shouldBounce && !ball.hasBounced && newY + 30 >= dividerY && ball.vy > 0) {
          // Ball hit the divider
          newVy = -Math.abs(ball.vy) * 0.7; // Bounce with 70% energy retention
          newY = dividerY - 30; // Place ball at divider
          newHasBounced = true;
        }

        const newRotation = ball.rotation + ball.rotationSpeed * deltaTime;

        return {
          ...ball,
          x: newX,
          y: newY,
          vx: ball.vx,
          vy: newVy,
          rotation: newRotation,
          hasBounced: newHasBounced
        };
      }).filter(ball => {
        // Remove balls that are off screen (including horizontally)
        return ball.y < window.innerHeight + 40 && 
               ball.x > -10 && 
               ball.x < 110;
      }));

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Dragnal.us</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          Dragnal.<strong>us</strong>
        </h1>

        <img onClick={(e) => playMusic()} src={image} className="drag" />
        
        <div className="card">
          { musicCount >= 30 &&
            <h3>Rank: <strong>Noise God</strong></h3>
          }
          { musicCount < 30 &&
          <h3>&nbsp;</h3>
          }
        </div>
        
        <p className="drag-text">Click the photo. Keep clicking to reveal your <strong>inner noise musician</strong>.</p>

      </main>

      {/* Tennis balls */}
      {goodBoyMode && tennisBalls.map(ball => (
        <div
          key={ball.id}
          className="tennis-ball"
          style={{
            left: `${ball.x}%`,
            top: `${ball.y}px`,
            transform: `rotate(${ball.rotation}deg)`
          }}
        />
      ))}

      {/* Footer */}
      <footer>
        <Waveform isPlaying={musicCount > 0} audioElements={musics} onClippingChange={handleClipping} />
        <div className="footer-content">
          <h3 className="visitor-count">
            Visitor count: <strong>{visitorCount}</strong>
          </h3>
          
          {/* Stop Button */}
          {isClipping && (
            <button className="stop-button" onClick={(e) => stopMusic()}>
              <p className="drag-text">please god <strong>make it stop</strong></p>
            </button>
          )}
          
          {/* Good Boy Mode Toggle */}
          <div className="good-boy-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={goodBoyMode}
                onChange={(e) => setGoodBoyMode(e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">
                <strong>good boy</strong> mode
              </span>
            </label>
          </div>
        </div>
      </footer>
    </div>
  )
}


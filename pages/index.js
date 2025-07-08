import Head from 'next/head'
import {useState, useEffect, useRef} from "react";
import {pick} from "next/dist/lib/pick";
import Waveform from '../components/Waveform';

export default function Home() {
  const [musicCount, setmusicCount] = useState(0);
  const [musics, setMusics] = useState([]);
  const [image, setImage] = useState("");
  const [visitorIndex, setVisitorIndex] = useState(Math.floor(Math.random()*3));
  const [isClipping, setIsClipping] = useState(false);
  const [tennisBalls, setTennisBalls] = useState([]);
  const [goodBoyMode, setGoodBoyMode] = useState(false);
  const lastBallTimeRef = useRef(0);

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
    let num = 1;

    if (musicCount >= 30) {
      num = 4;
    } else if (musicCount >= 20) {
      num = 3;
    } else if (musicCount >= 10) {
      num = 2;
    }

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
    setmusicCount(musicCount + 1);
    setMusics([...musics, music]);
    pickMedia()
    console.log("music count = ", musicCount);
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

  // Handle tennis ball animation
  const handleClipping = (clippingState) => {
    setIsClipping(clippingState);
    
    // Add a new tennis ball when clipping starts (max 25 per second)
    if (clippingState) {
      const now = Date.now();
      if (now - lastBallTimeRef.current < 40) return; // 1000ms / 25 = 40ms minimum interval
      lastBallTimeRef.current = now;
      
      // Determine if this ball should bounce (20% chance)
      const shouldBounce = Math.random() < 0.2;
      
      const newBall = {
        id: Date.now() + Math.random(),
        x: Math.random() * 90 + 5, // Random position between 5% and 95%
        y: -40, // Start above viewport
        vx: Math.random() * 60 - 30, // Horizontal velocity -30 to 30 px/s
        vy: Math.random() * 50 - 25, // Initial velocity -25 to 25 px/s
        rotation: 0,
        rotationSpeed: Math.random() * 360 - 180, // Random rotation speed
        shouldBounce: shouldBounce,
        hasBounced: false,
        startTime: Date.now()
      };
      setTennisBalls(prev => [...prev, newBall]);
    }
  };

  // Physics animation for tennis balls
  useEffect(() => {
    let animationFrame;
    const gravity = 980; // px/s²
    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Get divider position (approximate)
      const footer = document.querySelector('footer');
      const dividerY = footer ? footer.offsetTop - 10 : window.innerHeight * 0.75;

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
      }).filter(ball => ball.y < window.innerHeight + 40)); // Remove balls that fell off screen

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
        <Waveform isPlaying={musicCount > 0} audioElements={musics} onClippingChange={handleClipping} />
        
        <div className="card">
          { musicCount >= 30 &&
            <h3>Rank: <strong>Noise God</strong></h3>
          }
          { musicCount < 30 &&
          <h3>&nbsp;</h3>
          }
        </div>
        
        <p className="drag-text">Click the photo. Keep clicking to reveal your <strong>inner noise musician</strong>.</p>

        { isClipping &&
            <div className="card">
              <button onClick={(e) => stopMusic()}>
                <p className="drag-text">please god <strong>make it stop</strong></p>
              </button>
            </div>
        }

        <footer>
          <h3>
            Visitor count: <strong>{visitorCount}</strong>
          </h3>
        </footer>
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

      {/* Good Boy Mode Toggle */}
      {isClipping && (
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
      )}
    </div>
  )
}


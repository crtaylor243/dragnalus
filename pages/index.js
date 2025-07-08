import Head from 'next/head'
import {useState, useEffect} from "react";
import {pick} from "next/dist/lib/pick";
import Waveform from '../components/Waveform';

export default function Home() {
  const [musicCount, setmusicCount] = useState(0);
  const [musics, setMusics] = useState([]);
  const [image, setImage] = useState("");
  const [visitorIndex, setVisitorIndex] = useState(Math.floor(Math.random()*3));

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

    resetMedia();
    console.log("music count = ", musicCount);
  }

  // Initialize default media on component mount
  useEffect(() => {
    resetMedia();
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
        <Waveform isPlaying={musicCount > 0} audioElements={musics} />
        
        <div className="card">
          { musicCount >= 30 &&
            <h3>Rank: <strong>Noise God</strong></h3>
          }
          { musicCount < 30 &&
          <h3>&nbsp;</h3>
          }
        </div>
        
        <p className="drag-text">Click the photo. Keep clicking to reveal your <strong>inner noise musician</strong>.</p>

        { musicCount >= 3 &&
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
    </div>
  )
}


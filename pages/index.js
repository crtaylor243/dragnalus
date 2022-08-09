import Head from 'next/head'
import {useState} from "react";

export default function Home() {

  const [musicCount, setmusicCount] = useState(0);
  const [musics, setMusics] = useState([]);


  const visitorCounts = [69, 420, 666];
  const visitorCount = visitorCounts[Math.floor(Math.random()*3)];

  function playMusic() {;
    let music = new Audio();
    music.pause();
    music = new Audio("/dragnalus_unwound.mp3");
    music.play();
    setmusicCount(musicCount + 1);
    setMusics([...musics, music]);
    console.log("music count = ", musicCount);
  }

  function stopMusic() {
    musics.forEach(m => m.pause());
    setMusics([]);
    setmusicCount(0);
    console.log("music count = ", musicCount);
  }

  return (
    <div className="container">
      <Head>
        <title>Dragnal.us</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          Dragnal.<a href="https://www.dragnal.us">us</a>
        </h1>

        <h3>
          Visitor count: <strong>{visitorCount}</strong>
        </h3>

        { musicCount > 10 &&
            <h3>Rank: <strong>Noise God</strong></h3>
        }

        <img onClick={(e) => playMusic()} src="/drag.jpg" className="drag" />
        <p className="drag-text">Click the photo. Keep clicking to reveal your inner noise musician.</p>


        { musicCount >= 2 &&
            <footer>
              <p className="drag-text">please god make it stop</p>
              <button onClick={(e) => stopMusic()}>END ME</button>
            </footer>
        }
      </main>
    </div>
  )
}


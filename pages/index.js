import Head from 'next/head'
import {useState} from "react";
import {pick} from "next/dist/lib/pick";

export default function Home() {
  const defaultImage = isBirthday() ? "drag-1-bday.jpg" : "drag-1.jpg";

  const [musicCount, setmusicCount] = useState(0);
  const [musics, setMusics] = useState([]);
  const [image, setImage] = useState(defaultImage);
  const [visitorIndex, setVisitorIndex] = useState(Math.floor(Math.random()*3));

  const visitorCounts = [69, 420, 666];
  const visitorCount = visitorCounts[visitorIndex];


  function pickImage() {
    const base = "drag-";
    const tail = ".jpg";
    const birthday = isBirthday() ? "-bday" : "";
    let img = 1;

    if (musicCount >= 30) {
      img = 4;
    } else if (musicCount >= 20) {
      img = 3;
    } else if (musicCount >= 10) {
      img = 2;
    }

    const image = base + img + birthday + tail;
    console.log("picking image: ", image)
    setImage(image);
  }

  function isBirthday() {
    const birthDate = new Date(2021, 7, 11);
    const today = new Date()
    return birthDate.getDate() === today.getDate() &&
        birthDate.getMonth() === today.getMonth();
  }

  function resetImage() {
    setImage(defaultImage);
  }

  function playMusic() {;
    let music = new Audio();
    music.pause();
    music = new Audio("/dragnalus_unwound.mp3");
    music.play();
    setmusicCount(musicCount + 1);
    setMusics([...musics, music]);
    pickImage()
    console.log("music count = ", musicCount);
  }

  function stopMusic() {
    musics.forEach(m => m.pause());
    setMusics([]);
    setmusicCount(0);

    resetImage();
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
          Dragnal.<strong>us</strong>
        </h1>

        <div className="card">
          { musicCount > 30 &&
            <h3>Rank: <strong>Noise God</strong></h3>
          }
          { musicCount <= 30 &&
          <h3>- - -</h3>
          }
        </div>

        <img onClick={(e) => playMusic()} src={image} className="drag" />
        <p className="drag-text">Click the photo. Keep clicking to reveal your <strong>inner noise musician</strong>.</p>

        <footer>
          <h3>
            Visitor count: <strong>{visitorCount}</strong>
          </h3>
          { musicCount > 5 &&
              <div className="card">
                <button onClick={(e) => stopMusic()}>
                  <p className="drag-text">please god <strong>make it stop</strong></p>
                </button>
              </div>
          }
        </footer>
      </main>
    </div>
  )
}


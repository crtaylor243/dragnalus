import Head from 'next/head'

export default function Home() {

  const visitorCounts = [69, 420, 666];
  const visitorCount = visitorCounts[Math.floor(Math.random()*3)];

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

        <img onClick={(e) => playMusic()} src="/drag.jpg" className="drag" />
        <p>Click the photo. Keep clicking to reveal your inner noise musician.</p>
      </main>
    </div>
  )
}

function playMusic() {;
  console.log('The link was clicked.');
  var music = new Audio();
    music.pause();
    music = new Audio("/dragnalus_unwound.mp3");
    music.play();
}

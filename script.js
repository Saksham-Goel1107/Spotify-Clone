let currentSong = new Audio();
let isFirstPlay = true; // Flag to track if it's the first play or not
let songIndex = 0; // Index to track the current song in the playlist
let songs = []; // Initialize songs as an empty array
let currFolder;

// Fetch songs from a specific folder
async function getsongs(folder) {
  currFolder = folder;
  let a = await fetch(`/${folder}/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = []; // Reset the songs array to ensure it's always initialized as an empty array

  // Populate the songs array
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(`/${currFolder}/${element.href.split(`/${currFolder}/`)[1]}`);
    }
  }

  // If no songs are found, log an error and return an empty array.
  if (songs.length === 0) {
    console.error("No songs found in the folder.");
    return [];
  }

  // Render the songs list on the page
  let songUL = document.querySelector(".songList").getElementsByTagName("ol")[0];
  songUL.innerHTML = "";

  for (const song of songs) {
    songUL.innerHTML += `
      <div class="songInfo flex pointer">
        <img class="invert" src="music.svg" alt="music" />
        <div class="info">
          <div>${song.split(`/${currFolder}/`)[1]}</div>
          <div>Saksham</div>
        </div>
        <div class="playNow flex justify-center item-center">
          <span>Play Now</span>
          <img class="invert" src="playbtn.svg" alt="">
        </div>
      </div>`;
  }

  // Add click event listeners to each song item
  Array.from(document.querySelector(".songList").querySelectorAll(".songInfo")).forEach((e) => {
    e.addEventListener("click", () => {
      const track = e.querySelector(".info").firstElementChild.innerHTML.trim();
      songIndex = songs.findIndex((song) => song.split("/").pop() === track); // Fix: Compare only the file name
      if (songIndex !== -1) {
        playMusic(songs[songIndex]);
        resetLoopIcon(); // Reset loop icon whenever a new song is selected
      }
    });
  });
}

document.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // Prevent the default context menu from opening
});

const playMusic = (track, pause = false) => {
  if (pause) {
    currentSong.pause();
    play.src = "playbtn.svg";
    return;
  }

  if (!track || track === "") {
    console.error("Track is empty or undefined.");
    return;
  }

  currentSong.src = track;
  currentSong.play();
  currentSong.loop = false; // Disable looping for the current song (unless explicitly set)
  play.src = "pause.svg";

  document.querySelector(".songName").innerHTML = track.replace(`/${currFolder}/`, " ");
  document.querySelector(".songTime").innerHTML = "00:00/00:00";
};

function secondsToMinutes(seconds) {
  seconds = Math.floor(seconds);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

async function main() {
  await getsongs("songs/first");

  // Check if songs is correctly populated before proceeding
  if (songs.length > 0) {
    currentSong.src = songs[0]; // Load first song but do not play yet
    document.querySelector(".songName").innerHTML =
      songs[0].split(`/${currFolder}/`)[1]; // Display the song name
    document.querySelector(".songTime").innerHTML = "00:00/00:00"; // Display initial time
    play.src = "playbtn.svg"; // Set play button to "play" state initially
  } else {
    console.error("No songs available to play.");
    return; // Exit if there are no songs to play
  }

  play.addEventListener("click", () => {
    if (isFirstPlay) {
      if (songs.length > 0) {
        playMusic(songs[songIndex]);
        isFirstPlay = false; // Set the flag to false after the first play
      }
    } else {
      if (currentSong.paused) {
        currentSong.play();
        play.src = "pause.svg";
      } else {
        currentSong.pause();
        play.src = "playbtn.svg";
      }
    }
  });

  // Listen for when the song ends
  currentSong.addEventListener("ended", () => {
    if (currentSong.loop) {
      // If looping is enabled, restart the song instead of moving to the next one
      currentSong.currentTime = 0; // Reset the song to the beginning
      currentSong.play(); // Play the song again
    } else {
      if (songs.length > 0) {
        songIndex++; // Move to the next song
        if (songIndex >= songs.length) {
          songIndex = 0; // Loop back to the first song if at the end
        }
        playMusic(songs[songIndex]); // Play the next song
        resetLoopIcon(); // Reset the loop icon to inactive after song change
      }
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songTime").innerHTML = `${secondsToMinutes(
      currentSong.currentTime
    )}/${secondsToMinutes(currentSong.duration || 0)}`;

    const progress = (currentSong.currentTime / currentSong.duration) * 100;
    document.querySelector(".circle").style.left = `${progress}%`;
  });

  document.querySelector(".seekBar").addEventListener("click", (e) => {
    const seekBar = e.target.getBoundingClientRect();
    const clickPosition = (e.offsetX / seekBar.width) * currentSong.duration;
    currentSong.currentTime = clickPosition;
  });
}

document.querySelector(".previousbtn").addEventListener("click", () => {
  if (songs.length > 0) {
    songIndex--; // Move to the previous song
    if (songIndex < 0) {
      songIndex = songs.length - 1; // Loop back to the last song if at the beginning
    }
    playMusic(songs[songIndex]); // Play the previous song
    resetLoopIcon(); // Reset the loop icon to inactive after song change
  }
});

document.querySelector(".nextbtn").addEventListener("click", () => {
  if (songs.length > 0) {
    songIndex++; // Move to the next song
    if (songIndex >= songs.length) {
      songIndex = 0; // Loop back to the first song if at the end
    }
    playMusic(songs[songIndex]); // Play the next song
    resetLoopIcon(); // Reset the loop icon to inactive after song change
  }
});

// Looping feature button
document.querySelector(".loop").addEventListener("click", (e) => {
  currentSong.loop = !currentSong.loop; // Toggle loop on/off

  if (currentSong.loop) {
    e.target.classList.add("active"); // Show active state if looping
  } else {
    e.target.classList.remove("active"); // Remove active state if not looping
  }
});

let previousVolume = 1; // Store the previous volume before muting

document.querySelector(".volumeimg").addEventListener("click", (e) => {
  const volumeRange = document.querySelector(".volumerange");

  if (currentSong.volume > 0) {
    previousVolume = currentSong.volume;
    currentSong.volume = 0;
    e.target.src = "mute.svg";
    volumeRange.value = 0;
  } else {
    currentSong.volume = previousVolume;
    e.target.src = "volume.svg";
    volumeRange.value = previousVolume * 100;
  }
});

document.querySelector(".volumerange").addEventListener("input", (e) => {
  currentSong.volume = parseInt(e.target.value) / 100;
  if (currentSong.volume === 0) {
    document.querySelector(".volumeimg").src = "mute.svg";
  } else {
    document.querySelector(".volumeimg").src = "volume.svg";
  }
});

Array.from(document.getElementsByClassName("card")).forEach(e => {
  e.addEventListener("click", async items => {
    const folder = items.currentTarget.dataset.folder;
    
    await getsongs(`songs/${folder}`);
    currentSong.loop = false; // Ensure loop is off when a new folder is loaded
    resetLoopIcon(); // Reset the loop icon when a new folder is loaded
  });
});

// Helper function to reset loop icon to inactive state
function resetLoopIcon() {
  const loopButton = document.querySelector(".loop");
  loopButton.classList.remove("active"); // Remove active class to reset the loop icon


}
  function left() {
    document.querySelector(".left").style.left = 0+"%";
  }
  function goleft() {
    document.querySelector(".left").style.left = -100 + "%";
  }


main();

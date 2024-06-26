import React, { useState, useEffect } from "react";
import { searchMusicRecommendations, loggedin } from "./Utils";
import * as Utils from "./Utils"; // Import functions from Utils.js

const FindMusic = () => {
  // State declarations
  const [selectedGenre, setSelectedGenre] = useState("");
  const [tempo, setTempo] = useState("");
  const [popularity, setPopularity] = useState({
    min: 0,
    max: 100,
    target: 50,
  });
  const [limit, setLimit] = useState(10); // Initialize limit state
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [playlistId, setPlaylistId] = useState(""); // State to store the playlist ID
  const [loggedIn, setLoggedIn] = useState(false); // State for user login status
  const [subgenres, setSubgenres] = useState([]); // State for subgenres
  const [selectedSubgenre, setSelectedSubgenre] = useState(""); // State for selected subgenre
  const [userId, setUserId] = useState(''); // State for storing user's Spotify user ID
  const [userName, setUserName] = useState(''); // State for storing user's name  
  const [currentPreview, setCurrentPreview] = useState(null); // State to track current audio preview
  const [playingTrack, setPlayingTrack] = useState(null); // State to track the currently playing track
  const [isPlaying, setIsPlaying] = useState(false);



  useEffect(() => {
    setLoggedIn(loggedin()); // Check if user is logged in when component mounts
  }, []);

  useEffect(() => {
    Utils.handleAuthorizationCode()
      .then(() => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
          Utils.getProfile(accessToken)
            .then(data => {
              if (data) {
                setUserName(data.display_name); // Setting user's name
                setUserId(data.id); // Set the user's Spotify user ID
              }
            })
            .catch(error => {
              console.error('Error fetching user profile:', error);
            });
        } else {
          console.error('Access token not found');
        }
      })
      .catch(error => {
        console.error('Error handling authorization code:', error);
      });
  }, []);
  

  const handleLogin = Utils.authenticate; // Function for handling login
  
  // Event handler functions
  const handleGenreChange = (event) => {
    const selectedMainGenre = event.target.value;
    setSelectedGenre(selectedMainGenre);
  
    // Format and set available subgenres based on selected main genre
    const formattedSubgenres = (genreSubgenres[selectedMainGenre] || []).map(subgenre => formatSubgenre(subgenre));
    setSubgenres(formattedSubgenres);
  };

  const formatSubgenre = (subgenre) => {
    // Split the subgenre string by spaces and capitalize each word
    return subgenre.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const handleSubgenreChange = (event) => {
    const selectedSubgenre = event.target.value;
    setSelectedSubgenre(selectedSubgenre);
  };

  const handleTempoChange = (event) => {
    setTempo(event.target.value);
  };

  // Helper functions to get min and max tempo based on selected tempo option
  const getMinTempo = (tempo) => {
    switch (tempo) {
      case "fast":
        return 120;
      case "slow":
        return 60;
      case "calm":
        return 90;
      default:
        return 0;
    }
  };

  const getMaxTempo = (tempo) => {
    switch (tempo) {
      case "fast":
        return 200;
      case "slow":
        return 100;
      case "calm":
        return 120;
      default:
        return 200;
    }
  };

  const handlePopularityChange = (event) => {
    const selectedValue = event.target.value;
    const [min, max] = selectedValue.split("-").map(Number);
    setPopularity({ min, max });
  };

  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value)); // Parse the value to integer and update the limit state
  };

  const handlePreviewPlay = (previewUrl, track) => {
    if (currentPreview) {
      Utils.pausePreview(currentPreview);
    }
  
    const audio = Utils.playPreview(previewUrl, setCurrentPreview);
    setPlayingTrack(track);
    setIsPlaying(true); // Set playing state to true when starting playback
  };
  
  const handlePause = () => {
    if (currentPreview) {
      Utils.pausePreview(currentPreview);
      setIsPlaying(false); // Update playing state to false when pausing
    }
  };
  
  // Lista gatunków
  const genreSubgenres = {
    pop: [
      "synth-pop",
      "pop-film",
      "r-n-b"
    ],
    "hip-hop": [
    ],
    rock: [
      "alt-rock",
      "black-metal",
      "emo",
      "goth",
      "hard-rock",
      "heavy-metal",
      "new-age",
      "metal",
      "metalcore",
      "punk",
    ],
    indie: [
      "indie-pop",
    ],
    jazz: [], // Brak podgatunków do dopasowania
    classical: [
      "opera",
      "piano",
    ],
    electronic: [
      "dubstep",
      "edm",
      "house",
      "techno",
      "trance",
    ],
    disco: [
      "funk",
    ],
    folk: [
      "sertanejo",
      "tango",
      "country"
    ],
    inne: [
      "anime",
      "blues",
      "ambient",
    ],
  };

  useEffect(() => {
  return () => {
    if (currentPreview) {
      Utils.pausePreview(currentPreview); // Pause the audio preview
      setCurrentPreview(null); // Reset current audio preview
      setPlayingTrack(null); // Reset playing track
      setIsPlaying(false); // Reset playing state
    }
  };
}, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedGenre) {
      alert("Proszę wybrać gatunek!");
      return; // Exit early if no genre is selected
    }
  
    const genreToSearch = selectedSubgenre || selectedGenre; // Use subgenre if selected, otherwise use main genre
  
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        console.error("Access token not found");
        return;
      }
  
      // Ensure that the genre name is lowercase for API compatibility
      const lowercaseGenreToSearch = genreToSearch.toLowerCase();
  
      let apiUrl = `https://api.spotify.com/v1/recommendations?seed_genres=${encodeURIComponent(
        lowercaseGenreToSearch
      )}`;
  
      // Add tempo parameter if tempo is selected
      if (tempo) {
        apiUrl += `&min_tempo=${getMinTempo(tempo)}&max_tempo=${getMaxTempo(
          tempo
        )}`;
      }
  
      apiUrl += `&min_popularity=${popularity.min}&max_popularity=${popularity.max}&limit=${limit}`;
  
      console.log("API URL:", apiUrl); // Log the constructed API URL to the console
  
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      if (data.error) {
        throw new Error(`API error! ${data.error.message}`);
      }
  
      setRecommendedTracks(data.tracks);
    } catch (error) {
      console.error("Error fetching recommended tracks:", error);
    }
  };

  return (
    <>
      {loggedIn ? (
        <>
        <div className="card">
          <h1>Wyszukiwarka Muzyczna</h1>
          <br></br>
          <div>
            <form onSubmit={handleSubmit}>
            <div className="form-container">
              <label>Gatunek:</label>
              <select value={selectedGenre} onChange={handleGenreChange}>
                <option value="">-</option>
                <option value="pop">Pop</option>
                <option value="hip-hop">Rap/Hip-Hop</option>
                <option value="rock">Rock/Metal</option>
                <option value="indie">Indie</option>
                <option value="jazz">Jazz</option>
                <option value="classical">Classical</option>
                <option value="electronic">Electronic</option>
                <option value="disco">Disco</option>
                <option value="new-age">New Age</option>
                <option value="folk">Folk</option>
                <option value="inne">Inne</option>
              </select>
              <br></br>

              <label>Podgatunek:</label>
              <select value={selectedSubgenre} onChange={handleSubgenreChange}>
                <option value="">-</option>
                {subgenres.map((subgenre, index) => (
                  <option key={index} value={subgenre}>
                    {subgenre}
                  </option>
                ))}
              </select>
              <br></br>

              <label>Tempo:</label>
              <select value={tempo} onChange={handleTempoChange}>
                <option value="">-</option>
                <option value="fast">Szybkie</option>
                <option value="slow">Wolne</option>
                <option value="calm">Spokojne</option>
              </select>
              <br></br>

              <label>Popularność:</label>
              <select
                value={`${popularity.min}-${popularity.max}`}
                onChange={handlePopularityChange}
              >
                <option value="">-</option>
                <option value="0-15">Mało popularne</option>
                <option value="16-40">Znane</option>
                <option value="41-70">Popularne</option>
                <option value="71-100">Bardzo Popularne</option>
              </select>
              <br></br>

              <label>Ilość piosenek:</label>
              <select value={limit} onChange={handleLimitChange}>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
              </select>
            </div>
              <button className='recommend-songs' type="submit">Wyszukaj piosenki</button>
            </form>
          </div>
          <br></br>

          <div>
            {/* <h3>Wyniki twojego wyszukiwania</h3> */}
            <div className="recommended-main">
              <ul>
              {recommendedTracks.map((track, index) => (
                <li key={index}>
                  <div>
                    <img
                      src={track.album.images[0].url}
                      alt="Album Cover"
                      style={{ width: "50px", height: "50px" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontWeight: "bold" }}>
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </span>{" "}
                    - {track.name}
                    <br />
                    {track.preview_url ? (
                      <>
                        {playingTrack === track && isPlaying ? (
                          <button onClick={handlePause}>Pause</button>
                        ) : (
                          <button onClick={() => handlePreviewPlay(track.preview_url, track)}>
                            Play
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="song-preview">Preview not available</p>
                    )}
                  </div>
                </li>
              ))}
              </ul>
            </div>
          </div>
          </div>
        </>
      ) : (
        <>
          <h3>Żeby wyświetlić zawartość tej strony - Zaloguj Się!</h3>
          <button className="login" onClick={handleLogin}>Zaloguj się ze Spotify</button>
        </>
      )}
    </>
  );
};

export default FindMusic;

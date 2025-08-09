import { useState, useEffect } from 'react';
import dart_board from './dart_board.svg';
import './App.css';

/*
main function (runs the app)
*/
function App() {

// game states
const [step, setStep] = useState('intro');
const [numPlayers, setNumPlayers] = useState(2); //start with 2 players by default
const [playerNames, setPlayerNames] = useState([]); //empty player array

  /* 
  handleStartSetup()
  fills array numPlayers with empty strings, sets step to 'name-entry'
  */
  const handleStartSetup = () => {
    setPlayerNames(Array(numPlayers).fill('')); //initialize with empty strings
    setStep('name-entry'); //change to name-entry step
  };

  /* 
  handleStartSetup(index, name)
  updates playerNames depending on index and name passed to the function
  */
  const handleNameChange = (index, name) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated); //apply updated player names
  };

  /* handleStartSetup(index, name)
   maps player names accordingly and sets step to 'game'
  */
  const handleStartGame = () => {
    const filledNames = playerNames.map((n, i) => n.trim() || `Player ${i + 1}`); //loops through each name and its index (trim removes whitespace from the name string)
    setPlayerNames(filledNames);
    setStep('game'); //change to game step
  };
  
  //------------------------------------------------------------------------------------------------------------------
  return (
    <div className="App">
      <header className="App-header">
        <h2> CRICKET MASTER KILLER </h2>
        {step === 'intro' && (
          <> 
            <img src={dart_board} className="Dart-board" alt='dart-board'/>
            <div className="player-select">
            <label htmlFor="playerCount">Number of Players:</label>

            <select
              id="playerCount"
              value={numPlayers}
              onChange={(e) => setNumPlayers(parseInt(e.target.value))}
            >
              {[...Array(8)].map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
    </div>
            <button className="App-link" onClick={handleStartSetup}>
              Next
            </button>
          </>
        )}
      
        {step === 'name-entry' && (
          <div className="dropdown-score select">
            <h>Enter Player Names</h>
            <div>

            </div>
            {[...Array(numPlayers)].map((_, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Player ${i + 1}`}
                value={playerNames[i] || ''}
                onChange={(e) => handleNameChange(i, e.target.value)}
                className="name-input"
              />
            ))}
            <button className="App-link" onClick={handleStartGame}>
              Begin Game
            </button>
          </div>
        )}

        {step === 'game' && (
          <ScoringGrid
            playerNames={playerNames}
            onRestart={() => {
              setStep('intro');
              setPlayerNames([]);
            }}
          />
        )}
      </header>
    </div>
  );
}
//------------------------------------------------------------------------------------------------------------------

/*
scoringGrid()
react component that handles game logic
*/
function ScoringGrid({ playerNames, onRestart }) {

  //declarations
  const scoringNumbers = [20, 19, 18, 17, 16, 15, 'Bull'];
  const otherNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 'Miss'];
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [throwCount, setThrowCount] = useState(0);
  const [players, setPlayers] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const currentPlayer = players[currentPlayerIndex];
  
  //creates a mapping of values to values (1-20, Bull, and Miss)
  const valueMap = {
    Bull: 25,
    Miss: 25,
    ...Object.fromEntries([...Array(21).keys()].slice(1).map(n => [n, n]))
  };
  const allScoringKeys = [...scoringNumbers, ...otherNumbers]; //combines all board numbers into a new list (shallow clone)
  const initialScore = Object.fromEntries(allScoringKeys.map(n => [n, 0])); //?
 
  //initialize players whenever playerNames changes
  useEffect(() => {
    const newPlayers = playerNames.map(name => ({
      name,
      score: { ...initialScore },
      totalScore: 0,
    }));
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setThrowCount(0);
    }, [playerNames]
  ); 

  /*
  handleScoreClick(scoreKey)
  object used to deal with score updates
  */
  const handleScoreClick = (scoreKey) => {
    
    /*
    setPlayers(prevPlayers)
    handles player selection
    */ 
    setPlayers((prevPlayers) => {
      const updatedPlayers = [...prevPlayers];
      const currentPlayer = { ...updatedPlayers[currentPlayerIndex] };
      const updatedScore = { ...currentPlayer.score };
      const currentHits = updatedScore[scoreKey];
      const othersHaveNotClosed = updatedPlayers.some( 
        (p, i) => i !== currentPlayerIndex && p.score[scoreKey] < 3
      );
      
      //if the player hits one of the non-cricket numbers
      if (otherNumbers.includes(scoreKey)) {
        currentPlayer.totalScore += valueMap[scoreKey] * multiplier;
      }
      
      //else if the player hits a cricket number
      else {
     
        //if the player has made less than three throws
        if (currentHits < 3) {
          updatedScore[scoreKey] = currentHits + multiplier;//use min function?

        }

        //else if the player has made three throws
        else {

          //if the number is not fully closed
          if (othersHaveNotClosed) {

            //update every other player's score, taking into account the number of hits on the number that the other players have
            for (let i = 0; i < updatedPlayers.length; i++) {
              if (currentPlayerIndex !== i) {
                updatedPlayers[i].totalScore += valueMap[scoreKey] * (currentHits - updatedPlayers[i].score[scoreKey]) * multiplier/2;//why divide by 2?
              }
            } 
          }
          
          //else if the number is fully closed
          else {

            //update the current player's score
            currentPlayer.totalScore += valueMap[scoreKey] * multiplier;
          }
        }
      }

      //update the player's score accordingly
      currentPlayer.score = updatedScore;
      updatedPlayers[currentPlayerIndex] = currentPlayer;
      return updatedPlayers;
    });

    const newThrowCount = throwCount + 1;

    if (newThrowCount >= 3) {
      setThrowCount(0);
      setCurrentPlayerIndex((prev) => (prev + 1) % playerNames.length);
      setMultiplier(1);
    } else {
      setThrowCount(newThrowCount);
    }
  };
 
  //------------------------------------------------------------------------------------------------------------------
  return (
    <div className="scoring-grid">
  <h2>{currentPlayer?.name}</h2>

      <div className="grid">
        {scoringNumbers.map((score) => (
          <button
            key={score}
            className="grid-button"
            onClick={() => handleScoreClick(score)}
          >
            {score}
          </button>
        ))}
      </div>
      
      <div className="dropdown-score">
        <select
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val)) handleScoreClick(val);
            e.target.value = ""; // Reset after selection
          }}
        >
          <option value="">Select another number</option>
          {otherNumbers.map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
      <h2> Throw {throwCount + 1} / 3</h2>
      <div className = "multiplier-buttons">
      <button onClick={() => setMultiplier(1)}>Single</button>
      <button onClick={() => setMultiplier(2)}>Double</button>
      <button onClick={() => setMultiplier(3)}>Triple</button>
      </div>
      <div className="player-scores">
        {players.map((player, idx) => (
          <div key={idx} className="player-card">
            <h3>{player.name}</h3>
            <p><strong>Total Score:</strong> {player.totalScore}</p>
            <ul>
              {scoringNumbers.map((score) => (
                <li key={score}>
                  {score}: {player.score[score]}{" "}
                  {player.score[score] >= 3 ? "- Closed" : "- Open"}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button className="restart-button" onClick={onRestart}>
        Restart Game
      </button>
    </div>
  );
}
//------------------------------------------------------------------------------------------------------------------

export default App;
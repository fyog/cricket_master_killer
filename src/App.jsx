import { useState, useEffect } from 'react';
import dart_board from './dart_board.svg';
import './App.css';

/*
main function (runs the app)
*/
function App() {

// game states (state variables)
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
state is fully private to the component that declares it
use a state variable when a component needs to 'remember' some information betweeen renders
state variables are declared by calling the useState Hook
hooks are special functions that start with use, which let you “hook into” React features like state
*/
function ScoringGrid({ playerNames, onRestart }) {

  const scoringNumbers = [20, 19, 18, 17, 16, 15, 'Bull'];
  const otherNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 'Miss'];
  const [history, setHistory] = useState([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [throwCount, setThrowCount] = useState(0);
  const [players, setPlayers] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const currentPlayer = players[currentPlayerIndex];
  const [modifier, setModifier] = useState(1);
  
  //creates a mapping such that 1:20 is mapped to 1:20, Bull:25, and Miss:25
  //ie. mapping = 1:1, 2:2, 3:3, 4:4, ..., 20:20, Bull:25, Miss:25
  const valueMap = {
    Bull: 25,
    Miss: 25,
    ...Object.fromEntries([...Array(21).keys()].slice(1).map(n => [n, n]))
  };
  const allScoringKeys = [...scoringNumbers, ...otherNumbers]; //combines all board numbers into a new list (shallow clone)
  const initialScore = Object.fromEntries(allScoringKeys.map(n => [n, 0])); //maps a score of zero to all of the scoring keys
 
  /*
  useEffect() 
  synchronize a component with an external system
  */
  useEffect(() => {
    const newPlayers = playerNames.map(name => ({
      name,
      score: { ...initialScore },
      totalScore: 0,
    })); //creates a map of player names to their name, scores for each number, and total score
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setThrowCount(0);
    }, [playerNames] //dependency array is playerNames (throws a warning)
  ); 

  /*
  handleScoreClick(scoreKey)
  object used to deal with score updates
  */
  const handleScoreClick = (scoreKey) => {
  //save current state for undo
  setHistory(prev => [
    ...prev,
    {
      players: JSON.parse(JSON.stringify(players)),
      currentPlayerIndex,
      throwCount,
      multiplier,
      modifier
    }
  ]);

  setPlayers(prevPlayers => {
    const updatedPlayers = [...prevPlayers];
    const current = { ...updatedPlayers[currentPlayerIndex] };
    const updatedScore = { ...current.score };
    const currentHits = updatedScore[scoreKey];
    const othersHaveNotClosed = updatedPlayers.some(
      (p, i) => i !== currentPlayerIndex && p.score[scoreKey] < 3
    );

    //non-cricket number → straight score
    if (otherNumbers.includes(scoreKey)) {
      current.totalScore += valueMap[scoreKey] * multiplier;

    //cricket number
    } else {

      if (currentHits < 3) {
        updatedScore[scoreKey] = currentHits + multiplier;
        const extraHits = Math.max(0, updatedScore[scoreKey] - 3);
        //if (updatedScore[scoreKey] > 3) { document.write(extraHits);}
        if (extraHits > 0) {
          updatedScore[scoreKey] = 3;
          updatedPlayers.forEach((p, i) => {
            if (i !== currentPlayerIndex) {
              const diff = Math.max(0, updatedScore[scoreKey] - p.score[scoreKey]);
              p.totalScore += valueMap[scoreKey] * extraHits * diff / 2;
            }
          });
        }
      } else {

        //not fully closed
        if (othersHaveNotClosed) {
          updatedPlayers.forEach((p, i) => {
            if (i !== currentPlayerIndex) {
              const diff = Math.max(0, 3 - p.score[scoreKey]);
              p.totalScore += valueMap[scoreKey] * diff * multiplier / 2;
            }
          });
        } 
        
        //fully closed
        else {
          current.totalScore += valueMap[scoreKey] * multiplier;
        }
      }
    }

    current.score = updatedScore;
    updatedPlayers[currentPlayerIndex] = current;
    return updatedPlayers;
  });

  const newCount = throwCount + 1;
  if (newCount >= 3) {
    setThrowCount(0);
    setCurrentPlayerIndex(prev => (prev + 1) % playerNames.length);
    setMultiplier(1);
    setModifier(1);
  } else {
    setThrowCount(newCount);
  }
};

  const handleUndo = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev; //nothing to undo

    const lastState = prev[prev.length - 1];
    setPlayers(lastState.players);
    setCurrentPlayerIndex(lastState.currentPlayerIndex);
    setThrowCount(lastState.throwCount);
    setMultiplier(lastState.multiplier);

    return prev.slice(0, -1); //remove last history entry
  });
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
      onClick={() => handleScoreClick(score)}>
        {score}
      </button>
      ))}
    </div>
    <div className="dropdown-score">
      <select
        onChange={(e) => {
        const val = e.target.value;

        //if it's an empty string, do nothing
        if (!val) return;

        //if it's a number string, convert to number
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          handleScoreClick(numVal);
        } else {

          //handle 'Miss' or 'Bull' or any future string option
          handleScoreClick(val);
        }

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
      <button className="undo-button" onClick={handleUndo}> Undo </button>
      <button className="restart-button" onClick={onRestart}> Restart Game </button>
    </div>  
  );
}
//------------------------------------------------------------------------------------------------------------------

export default App;
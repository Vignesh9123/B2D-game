import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Trophy, Zap, Binary, Hash } from 'lucide-react';

type GameMode = 'binary-to-decimal' | 'decimal-to-binary' | 'mixed';
type Difficulty = 4 | 8 | 12;
type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';

interface GameStats {
  score: number;
  streak: number;
  maxStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  highScore: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('mixed');
  const [difficulty, setDifficulty] = useState<Difficulty>(8);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameDuration] = useState(30);
  
  const [currentNumber, setCurrentNumber] = useState(0);
  const [currentMode, setCurrentMode] = useState<'binary-to-decimal' | 'decimal-to-binary'>('binary-to-decimal');
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    streak: 0,
    maxStreak: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    highScore: parseInt(localStorage.getItem('binaryGameHighScore') || '0')
  });

  const generateNewNumber = useCallback(() => {
    const maxValue = Math.pow(2, difficulty) - 1;
    const newNumber = Math.floor(Math.random() * (maxValue + 1));
    setCurrentNumber(newNumber);
    
    if (gameMode === 'mixed') {
      setCurrentMode(Math.random() > 0.5 ? 'binary-to-decimal' : 'decimal-to-binary');
    } else {
      setCurrentMode(gameMode);
    }
  }, [difficulty, gameMode]);

  const formatBinary = (num: number) => {
    return num.toString(2).padStart(difficulty, '0');
  };

  const checkAnswer = useCallback(() => {
    if (!userInput.trim()) return;

    let isCorrect = false;
    
    if (currentMode === 'binary-to-decimal') {
      isCorrect = parseInt(userInput) === currentNumber;
    } else {
      const binaryInput = userInput.replace(/[^01]/g, '');
      isCorrect = parseInt(binaryInput, 2) === currentNumber;
    }

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    setStats(prev => {
      const newStats = {
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
        streak: isCorrect ? prev.streak + 1 : 0,
        score: prev.score + (isCorrect ? (10 + prev.streak * 2) : 0)
      };
      newStats.maxStreak = Math.max(newStats.maxStreak, newStats.streak);
      return newStats;
    });

    setTimeout(() => {
      setFeedback(null);
      setUserInput('');
      generateNewNumber();
    }, 1000);
  }, [userInput, currentNumber, currentMode, generateNewNumber]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(gameDuration);
    setStats(prev => ({
      ...prev,
      score: 0,
      streak: 0,
      totalCorrect: 0,
      totalAnswered: 0
    }));
    generateNewNumber();
  };

  const endGame = useCallback(() => {
    setGameState('gameOver');
    const newHighScore = Math.max(stats.score, stats.highScore);
    if (newHighScore > stats.highScore) {
      localStorage.setItem('binaryGameHighScore', newHighScore.toString());
      setStats(prev => ({ ...prev, highScore: newHighScore }));
    }
  }, [stats.score, stats.highScore]);

  const resetGame = () => {
    setGameState('menu');
    setUserInput('');
    setFeedback(null);
  };

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
  }, [gameState, timeLeft, endGame]);

  // Handle enter key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && gameState === 'playing' && userInput.trim()) {
        checkAnswer();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [checkAnswer, gameState, userInput]);

  const getBinaryDisplay = () => {
    const binary = formatBinary(currentNumber);
    return binary.split('').map((bit, index) => (
      <span
        key={index}
        className={`inline-block w-8 h-8 leading-8 text-center mx-1 rounded text-lg font-mono font-bold ${
          bit === '1' 
            ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50' 
            : 'bg-gray-700 text-gray-400'
        } transition-all duration-300`}
      >
        {bit}
      </span>
    ));
  };

  const getAccuracy = () => {
    return stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Binary className="w-12 h-12 text-cyan-400 mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Binary Quest
              </h1>
            </div>
            <p className="text-gray-300 text-lg">Master binary conversion under pressure!</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Game Mode</label>
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value as GameMode)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="binary-to-decimal">Binary → Decimal</option>
                <option value="decimal-to-binary">Decimal → Binary</option>
                <option value="mixed">Mixed Mode</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value) as Difficulty)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value={4}>Easy (4-bit, 0-15)</option>
                <option value={8}>Medium (8-bit, 0-255)</option>
                <option value={12}>Hard (12-bit, 0-4095)</option>
              </select>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>High Score:</span>
                <span className="text-yellow-400 font-bold">{stats.highScore}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25"
            >
              <Play className="w-5 h-5 inline mr-2" />
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
            <p className="text-gray-300">Time's up! Here are your results:</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-cyan-400">{stats.score}</div>
                  <div className="text-sm text-gray-300">Final Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{stats.maxStreak}</div>
                  <div className="text-sm text-gray-300">Best Streak</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-green-400">{stats.totalCorrect}</div>
                  <div className="text-sm text-gray-300">Correct</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-400">{getAccuracy()}%</div>
                  <div className="text-sm text-gray-300">Accuracy</div>
                </div>
              </div>
            </div>

            {stats.score === stats.highScore && stats.score > 0 && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                <div className="text-yellow-400 font-bold">🎉 NEW HIGH SCORE! 🎉</div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <Play className="w-5 h-5 inline mr-2" />
              Play Again
            </button>
            <button
              onClick={resetGame}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
            >
              <RotateCcw className="w-5 h-5 inline mr-2" />
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-black/40 backdrop-blur-lg rounded-xl border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{timeLeft}s</div>
            <div className="text-sm text-gray-300">Time Left</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(timeLeft / gameDuration) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-lg rounded-xl border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.score}</div>
            <div className="text-sm text-gray-300">Score</div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-lg rounded-xl border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center">
              <Zap className="w-6 h-6 mr-1" />
              {stats.streak}
            </div>
            <div className="text-sm text-gray-300">Streak</div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-lg rounded-xl border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{getAccuracy()}%</div>
            <div className="text-sm text-gray-300">Accuracy</div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center shadow-2xl">
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-gray-800/50 rounded-full text-sm text-gray-300 mb-4">
              {currentMode === 'binary-to-decimal' ? (
                <>
                  <Binary className="w-4 h-4 mr-2" />
                  Convert Binary to Decimal
                </>
              ) : (
                <>
                  <Hash className="w-4 h-4 mr-2" />
                  Convert Decimal to Binary
                </>
              )}
            </div>
          </div>

          <div className="mb-8">
            {currentMode === 'binary-to-decimal' ? (
              <div className="mb-4">
                <div className="text-lg text-gray-300 mb-3">Convert this binary number:</div>
                <div className="flex justify-center items-center flex-wrap">
                  {getBinaryDisplay()}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="text-lg text-gray-300 mb-3">Convert this decimal number to binary:</div>
                <div className="text-5xl font-bold text-white bg-gray-800/50 rounded-xl py-4 px-6 inline-block">
                  {currentNumber}
                </div>
              </div>
            )}
          </div>

          <div className="max-w-md mx-auto">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={currentMode === 'binary-to-decimal' ? 'Enter decimal number' : 'Enter binary (0s and 1s only)'}
              className={`w-full text-2xl text-center py-4 px-6 rounded-xl border-2 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                feedback === 'correct' 
                  ? 'border-green-500 bg-green-500/20' 
                  : feedback === 'incorrect' 
                  ? 'border-red-500 bg-red-500/20' 
                  : 'border-gray-600 focus:border-cyan-500 focus:bg-gray-800/70'
              }`}
              disabled={feedback !== null}
            />
            
            <button
              onClick={checkAnswer}
              disabled={!userInput.trim() || feedback !== null}
              className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
            >
              Submit Answer
            </button>
          </div>

          {feedback && (
            <div className={`mt-6 text-xl font-bold transition-all duration-500 ${
              feedback === 'correct' ? 'text-green-400' : 'text-red-400'
            }`}>
              {feedback === 'correct' ? '✅ Correct!' : '❌ Incorrect!'}
              {feedback === 'correct' && stats.streak > 1 && (
                <div className="text-yellow-400 text-lg mt-1">
                  🔥 {stats.streak} in a row! +{10 + (stats.streak - 1) * 2} points
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-6 text-sm text-gray-400 bg-black/20 rounded-full px-6 py-3">
            <span>Correct: {stats.totalCorrect}</span>
            <span>•</span>
            <span>Total: {stats.totalAnswered}</span>
            <span>•</span>
            <span>Best Streak: {stats.maxStreak}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
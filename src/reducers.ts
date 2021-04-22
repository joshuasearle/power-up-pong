import {
  constants,
  GameState,
  initialBall,
  initialGameState,
  TickHandler,
  CollisionHandler,
} from './types';
import { nextBallPos, mirrorBall, adjustPaddle } from './vector-maths';
import { collisionHandlers, handleCollisions } from './collisions';
import { randomlyAddPowerUp, powerUpCreators } from './powerups';

const stateAfterBreak = (prevState: GameState): GameState => {
  // If last tick of break, add ball back
  return {
    ...prevState,
    breakTicks: prevState.breakTicks === 1 ? 0 : prevState.breakTicks - 1,
    ball: prevState.breakTicks === 1 ? initialBall : prevState.ball,
    powerUpPresent: null,
    powerUpThisRound: false,
    rightPaddle: {
      ...prevState.rightPaddle,
      powerShotMode: false,
    },
    leftPaddle: { ...prevState.leftPaddle, powerShotMode: false },
  };
};

const isGameOver = (prevState: GameState): boolean => {
  return (
    prevState.score.leftPlayer >= constants.endScore ||
    prevState.score.rightPlayer >= constants.endScore ||
    prevState.gameOver
  );
};

const gameNotStarted = (prevState: GameState): boolean => {
  return !prevState.gameStarted;
};

const isGamePaused = (prevState: GameState): boolean => {
  return prevState.breakTicks > 0;
};

const handleGameOver = (prevState: GameState): GameState => {
  return {
    ...prevState,
    gameOver: true,
    powerUpPresent: null,
    powerUpThisRound: false,
  };
};

const handleNotStarted = (prevState: GameState): GameState => {
  return { ...prevState, gameStarted: false };
};

const handleNormalTick = powerUpCreators => (
  collisionHandlers: CollisionHandler[]
) => (prevState: GameState): GameState => {
  const powerUpAdded = randomlyAddPowerUp(powerUpCreators)(prevState);

  const collisionsHandled = handleCollisions(collisionHandlers)(powerUpAdded);
  const { leftPaddle, ball } = collisionsHandled;
  return {
    ...collisionsHandled,
    leftPaddle: mirrorBall(leftPaddle)(ball),
    ball: nextBallPos(ball),
  };
};

export const tickHandlers: TickHandler[] = [
  { stateCheck: isGameOver, stateHandler: handleGameOver },
  { stateCheck: gameNotStarted, stateHandler: handleNotStarted },
  { stateCheck: isGamePaused, stateHandler: stateAfterBreak },
  {
    stateCheck: () => true,
    stateHandler: handleNormalTick(powerUpCreators)(collisionHandlers),
  },
];

export const tickState = (tickHandlers: TickHandler[]) => (
  prevState: GameState
): GameState => {
  // Find first stateCheck that passes, and update the state based on the handler
  const tickHandler = tickHandlers.find(({ stateCheck }) =>
    stateCheck(prevState)
  ).stateHandler;

  return tickHandler(prevState);
};

export const movePaddle = (pixelsDown: number) => (
  prevState: GameState
): GameState => {
  const paddle = prevState.rightPaddle;
  const nextState = {
    ...prevState,
    rightPaddle: adjustPaddle(paddle)(pixelsDown),
  };

  return nextState;
};

export const unPause = (prevState: GameState): GameState => {
  return prevState.gameStarted && !prevState.gameOver
    ? prevState
    : {
        ...prevState,
        gameStarted: true,
        gameOver: false,
        score: prevState.gameOver
          ? { leftPlayer: 0, rightPlayer: 0 }
          : prevState.score,
        powerUpPresent: null,
        powerUpThisRound: false,
      };
};

export const restart = (prevState: GameState): GameState => {
  return initialGameState;
};

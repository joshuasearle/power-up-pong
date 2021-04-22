import { constants, PowerUp, GameState } from './types';
import { Vector } from './vector-maths';

const getPowerUpPos = () => {
  // Can spawn in middle quarter of the canvas to avoid unreachable power ups,
  // and obscuring the score / paddles
  return new Vector(
    (Math.random() * constants.canvasWidth) / 2 + constants.canvasWidth / 4,
    (Math.random() * constants.canvasHeight) / 2 + constants.canvasHeight / 4
  );
};

const createPowerPowerHit = (): PowerUp => {
  return {
    pos: getPowerUpPos(),
    colour: 'purple',
    stateReducer: powerHitStateReduce,
  };
};

const powerHitStateReduce = (prevState: GameState): GameState => {
  // Sets powerShotMode to true depending which paddle hit the powerup
  const leftToRightApproach = prevState.ball.vel.x > 0;
  return {
    ...prevState,
    leftPaddle: leftToRightApproach
      ? { ...prevState.leftPaddle, powerShotMode: true }
      : prevState.leftPaddle,
    rightPaddle: !leftToRightApproach
      ? { ...prevState.rightPaddle, powerShotMode: true }
      : prevState.rightPaddle,
    powerUpPresent: null,
    powerUpThisRound: true,
  };
};

const createGravityPowerUp = (): PowerUp => {
  return {
    pos: getPowerUpPos(),
    colour: 'green',
    stateReducer: gravityStateReduce,
  };
};

const gravityStateReduce = (prevState: GameState): GameState => {
  // Adds ball acceleration
  return {
    ...prevState,
    ball: {
      ...prevState.ball,
      acc: new Vector(0, constants.gravityAcc),
      colour: 'olive',
    },
    powerUpPresent: null,
    powerUpThisRound: true,
  };
};

export const powerUpCreators = [createPowerPowerHit, createGravityPowerUp];

export const randomlyAddPowerUp = powerUpCreators => (
  prevState: GameState
): GameState => {
  // If no powerups have been added, and we pass the random test,
  // add random powerup
  return prevState.powerUpPresent !== null || prevState.powerUpThisRound
    ? prevState
    : Math.random() > constants.powerUpChance
    ? prevState
    : {
        ...prevState,
        // Pick a random powerup
        powerUpPresent: powerUpCreators[
          Math.floor(Math.random() * powerUpCreators.length)
        ](),
      };
};

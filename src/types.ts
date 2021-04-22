import { Vector } from './vector-maths';

export type GameState = Readonly<{
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  ball: Ball;
  score: Score;
  breakTicks: number;
  gameOver: boolean;
  gameStarted: boolean;
  powerUpPresent: PowerUp;
  powerUpThisRound: boolean;
}>;

export type Paddle = Readonly<{
  id: string;
  pos: Vector;
  leftToRightApproach: boolean;
  powerShotMode: boolean;
}>;

export type PaddleType = Readonly<'left' | 'right'>;

export type Ball = Readonly<{
  pos: Vector;
  vel: Vector;
  acc: Vector;
  colour: string;
}>;

export type Score = Readonly<{
  leftPlayer: number;
  rightPlayer: number;
}>;

export type KeyEvent = Readonly<'keydown' | 'keyup'>;

export type Key = Readonly<'ArrowLeft' | 'ArrowRight' | ' ' | 'r'>;

export type TickHandler = Readonly<{
  stateCheck: (prevState: GameState) => boolean;
  stateHandler: (prevState: GameState) => GameState;
}>;

export type ViewRenderer = (
  canvas: HTMLElement
) => (gameState: GameState) => void;

export type CollisionHandler = (prevState: GameState) => GameState;

export const constants = {
  ballRadius: 10,
  paddleDist: 10,
  paddleWidth: 10,
  paddleHeight: 50,
  paddleDistFromEdge: 50,
  canvasWidth: 600,
  canvasHeight: 600,
  initialBallVelocity: new Vector(2, 0),
  leftPaddleSpeed: 2.5,
  endScore: 7,
  maxVelMultiplier: 4,
  maxAngleRotation: 30,
  maxAngle: 60,
  pauseTime: 100,
  powerUpRadius: 30,
  powerUpThisRound: false,
  gravityAcc: 0.03,
  powerUpChance: 0.002,
};

export const initialBall = {
  pos: new Vector(100, constants.canvasHeight / 2),
  vel: constants.initialBallVelocity,
  acc: new Vector(0, 0),
  colour: 'white',
};

export type PowerUp = Readonly<{
  pos: Vector;
  colour: string;
  stateReducer: (prevState: GameState) => GameState;
}> | null;

export const initialGameState: GameState = {
  leftPaddle: {
    id: 'left',
    pos: new Vector(constants.paddleDistFromEdge, constants.canvasHeight / 2),
    leftToRightApproach: false,
    powerShotMode: false,
  },
  rightPaddle: {
    id: 'right',
    pos: new Vector(
      constants.canvasWidth - constants.paddleDistFromEdge,
      constants.canvasHeight / 2
    ),
    leftToRightApproach: true,
    powerShotMode: false,
  },
  ball: initialBall,
  score: { leftPlayer: 0, rightPlayer: 0 },
  breakTicks: 0,
  gameOver: false,
  gameStarted: false,
  powerUpPresent: null,
  powerUpThisRound: false,
};

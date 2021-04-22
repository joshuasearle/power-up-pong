import {
  GameState,
  constants,
  Score,
  PaddleType,
  CollisionHandler,
} from './types';
import { invertYVel, newBallVelocity, Vector } from './vector-maths';

const wallHitHandler = (x: number) => (leftToRightApproach: boolean) => (
  prevState: GameState
): GameState => {
  const ball = prevState.ball;
  const multipler = leftToRightApproach ? 1 : -1;
  const velDir = Math.abs(ball.vel.x) / ball.vel.x;
  // Finds if ball hit wall
  const hit =
    (ball.pos.x - x) * multipler > constants.ballRadius && velDir === multipler;
  // Adds point to scorer
  const newScore: Score = {
    leftPlayer: prevState.score.leftPlayer + +leftToRightApproach,
    rightPlayer: prevState.score.rightPlayer + +!leftToRightApproach,
  };
  // Updates score and pauses, only if ball hit wall
  return hit
    ? { ...prevState, score: newScore, breakTicks: constants.pauseTime }
    : prevState;
};

const horiHitHandler = (y: number) => (topToBottomApproach: boolean) => (
  prevState: GameState
): GameState => {
  const ball = prevState.ball;
  const multiplier = topToBottomApproach ? -1 : 1;
  const velTopToBot = ball.vel.y > 0;
  const yInside = y + multiplier * constants.ballRadius;
  const yTop = y;

  // Update ball vel if ball hit roof / floor
  const newBall =
    ball.pos.y < Math.max(yInside, yTop) &&
    ball.pos.y > Math.min(yInside, yTop) &&
    velTopToBot === topToBottomApproach
      ? invertYVel(ball)
      : ball;
  return { ...prevState, ball: newBall };
};

const paddleCollsionHandler = (paddleType: PaddleType) => (
  prevState: GameState
): GameState => {
  const paddle =
    paddleType === 'left' ? prevState.leftPaddle : prevState.rightPaddle;
  const ball = prevState.ball;
  const { pos, leftToRightApproach } = paddle;
  const velLeftToRight = ball.vel.x > 0;
  const widthMultiplier = leftToRightApproach ? -1 : 1;

  // x value of the front of the paddle
  const xPaddleFront =
    pos.x +
    (widthMultiplier * constants.paddleWidth) / 2 +
    constants.ballRadius * widthMultiplier;
  // x value of middle of paddle
  const xPaddleMiddle = pos.x;

  // If ball between middle and front, and travelling right direction
  const xCollided =
    ball.pos.x < Math.max(xPaddleFront, xPaddleMiddle) &&
    ball.pos.x > Math.min(xPaddleFront, xPaddleMiddle) &&
    velLeftToRight === leftToRightApproach;

  const yPaddleTop = pos.y + constants.paddleHeight / 2 + constants.ballRadius;
  const yPaddleBottom =
    pos.y - constants.paddleHeight / 2 - constants.ballRadius;
  // If ball between top and bottom of paddle
  const yCollided =
    ball.pos.y < Math.max(yPaddleTop, yPaddleBottom) &&
    ball.pos.y > Math.min(yPaddleTop, yPaddleBottom);
  // Update ball if both x and y collided
  const newBall = xCollided && yCollided ? newBallVelocity(paddle)(ball) : ball;
  return { ...prevState, ball: newBall };
};

const powerUpHit = (prevState: GameState): boolean => {
  const powerUpPos = prevState.powerUpPresent.pos;
  const ballPos = prevState.ball.pos;
  return (
    powerUpPos.sub(ballPos).len() <=
    constants.powerUpRadius + constants.ballRadius
  );
};

export const handlePowerUpCollision = (prevState: GameState): GameState => {
  return !prevState.powerUpPresent || !powerUpHit(prevState)
    ? prevState
    : prevState.powerUpPresent.stateReducer(prevState);
};

export const collisionHandlers: CollisionHandler[] = [
  paddleCollsionHandler('left'),
  paddleCollsionHandler('right'),
  horiHitHandler(constants.canvasHeight)(true),
  horiHitHandler(0)(false),
  wallHitHandler(0)(false),
  wallHitHandler(constants.canvasWidth)(true),
  handlePowerUpCollision,
];

export const handleCollisions = (collisionHandlers: CollisionHandler[]) => (
  prevState: GameState
): GameState => {
  // Apply all of the collision handlers to the state
  return collisionHandlers.reduce((acc, handler) => handler(acc), prevState);
};

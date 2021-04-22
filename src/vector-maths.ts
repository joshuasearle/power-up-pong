import { Ball, constants, Paddle } from './types';

// This type was taken from the "asteroids" example
// This is not my code (although it is slightly modified)
export class Vector {
  constructor(public readonly x: number = 0, public readonly y: number = 0) {}
  add = (b: Vector) => new Vector(this.x + b.x, this.y + b.y);
  sub = (b: Vector) => this.add(b.scale(-1));
  len = () => Math.sqrt(this.x * this.x + this.y * this.y);
  scale = (s: number) => new Vector(this.x * s, this.y * s);
  ortho = () => new Vector(this.y, -this.x);
  rotate = (deg: number) =>
    (rad =>
      ((cos, sin, { x, y }) =>
        new Vector(x * cos - y * sin, x * sin + y * cos))(
        Math.cos(rad),
        Math.sin(rad),
        this
      ))((Math.PI * deg) / 180);
  degrees = () => Math.atan2(this.y, this.x) * (180 / Math.PI);
  static unitVecInDirection = (deg: number) =>
    new Vector(0, -1).rotate(deg + 90);
  static Zero = new Vector();
  unitVec = () => new Vector(this.x / this.len(), this.y / this.len());
}

export const invertYVel = (ball: Ball): Ball => {
  return {
    ...ball,
    vel: new Vector(ball.vel.x, -ball.vel.y),
  };
};

export const mirrorBall = (paddle: Paddle) => (ball: Ball): Paddle => {
  const yOffset = paddle.pos.y - ball.pos.y;

  // If already inline with ball, do nothing
  const inline = Math.abs(yOffset) < constants.paddleHeight / 2;
  const directMult = yOffset === 0 ? 0 : -Math.abs(yOffset) / yOffset;
  return inline
    ? paddle
    : {
        ...paddle,
        pos: new Vector(
          paddle.pos.x,
          paddle.pos.y + directMult * constants.leftPaddleSpeed
        ),
      };
};

export const newBallAngle = (paddle: Paddle) => (ball: Ball): number => {
  const offScore = getOffScore(paddle)(ball);
  const velMultiplier = Math.abs(ball.vel.x) / ball.vel.x;
  const degrees = offScore * constants.maxAngleRotation;
  const newVelDegrees = new Vector(-ball.vel.x, ball.vel.y)
    .rotate(degrees * velMultiplier)
    .degrees();

  // Makes the angle not able to go over a certain thresholds
  // i.e. Avoids cases where the angle goes to 91 degrees and takes forever to reach the other side
  // Might be a cleaner way to do this, but after much struggling this was the best I could come up with
  const adjustedVelDegrees =
    velMultiplier === -1 && newVelDegrees < -constants.maxAngle
      ? -constants.maxAngle
      : velMultiplier === -1 && newVelDegrees > constants.maxAngle
      ? constants.maxAngle
      : velMultiplier === 1 &&
        newVelDegrees > -180 + constants.maxAngle &&
        newVelDegrees < -90
      ? -180 + constants.maxAngle
      : velMultiplier === 1 &&
        newVelDegrees < 180 - constants.maxAngle &&
        newVelDegrees > 90
      ? 180 - constants.maxAngle
      : newVelDegrees;

  return adjustedVelDegrees;
};

export const newBallVelocity = (paddle: Paddle) => (ball: Ball): Ball => {
  const offScore = getOffScore(paddle)(ball);
  // Square the difference to make it harder to get full strength hit
  const velMultiplier = paddle.powerShotMode
    ? Math.abs(constants.initialBallVelocity.x) + constants.maxVelMultiplier
    : Math.abs(constants.initialBallVelocity.x) +
      (1 - Math.abs(offScore)) ** 2 * constants.maxVelMultiplier;

  const newAngleBall = newBallAngle(paddle)(ball);

  return {
    pos: ball.pos,
    vel: Vector.unitVecInDirection(newAngleBall).scale(velMultiplier),
    acc: new Vector(0, -ball.acc.y),
    colour: ball.colour,
  };
};

// Basically a score between 0 and 1, depending on how close the ball is to the middle of the paddle
// Exact middle = 0, top = 1, bottom = -1
const getOffScore = (paddle: Paddle) => (ball: Ball): number => {
  const yOffset = ball.pos.y - paddle.pos.y;
  const multiplier = yOffset === 0 ? 0 : -Math.abs(yOffset) / yOffset;
  const offScore =
    multiplier *
    (Math.abs(yOffset) / (constants.paddleHeight / 2 + constants.ballRadius));

  return offScore;
};

export const nextBallPos = ({ pos, vel, acc, colour }: Ball): Ball => {
  return {
    pos: new Vector(pos.x + vel.x, pos.y + vel.y),
    vel: new Vector(vel.x + acc.x, vel.y + acc.y),
    acc,
    colour,
  };
};

export const adjustPaddle = (paddle: Paddle) => (
  pixelsDown: number
): Paddle => {
  // Min and Max so paddle can't go off the map
  return {
    ...paddle,
    pos: new Vector(
      paddle.pos.x,
      Math.max(
        Math.min(
          paddle.pos.y + pixelsDown,
          constants.canvasHeight - constants.paddleHeight / 2
        ),
        2 * constants.paddleWidth + 5
      )
    ),
  };
};

export type GameState = Readonly<{
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  ball: Ball;
  score: Score;
  breakTicks: BreakTicks;
  gameOver: boolean;
}>;

export interface Paddle {
  id: string;
  pos: Vector;
  leftToRightApproach: boolean;
}

export interface Ball {
  pos: Vector;
  vel: Vector;
}

export type Score = number;

export type KeyEvent = 'keydown' | 'keyup';

export type Key = 'ArrowLeft' | 'ArrowRight';

// This type was taken from the asteroids example
// This is not my code
export class Vector {
  constructor(public readonly x: number = 0, public readonly y: number = 0) {}
  add = (b: Vector) => new Vector(this.x + b.x, this.y + b.y);
  sub = (b: Vector) => this.add(b.scale(-1));
  len = () => Math.sqrt(this.x * this.x + this.y * this.y);
  scale = (s: number) => new Vector(this.x * s, this.y * s);
  ortho = () => new Vector(this.y, -this.x);
  rotate = (deg: number) =>
    (rad =>
      ((cos, sin, { x, y }) => new Vector(x * cos - y * sin, x * sin + y * cos))(
        Math.cos(rad),
        Math.sin(rad),
        this
      ))((Math.PI * deg) / 180);

  static unitVecInDirection = (deg: number) => new Vector(0, -1).rotate(deg);
  static Zero = new Vector();
}

export class BreakTicks {
  constructor(public readonly tickCount: number) {}
  pauseThisRound(): boolean {
    return this.tickCount > 0;
  }

  nextState(gameState: GameState): GameState {
    const ball = this.tickCount === 1 ? initialBall : gameState.ball;
    return {
      ...gameState,
      breakTicks: new BreakTicks(this.tickCount - 1),
      ball: ball,
    };
  }
}

export interface GameEvent {
  nextState: (gameState: GameState) => GameState;
}

const mirrorBall = (paddle: Paddle, ball: Ball): Paddle => {
  const yOffset = paddle.pos.y - ball.pos.y;

  // If already inline with ball, do nothing
  if (Math.abs(yOffset) < constants.paddleHeight / 2) {
    return paddle;
  }
  const directMult = yOffset === 0 ? 0 : -Math.abs(yOffset) / yOffset;
  return {
    ...paddle,
    pos: new Vector(paddle.pos.x, paddle.pos.y + directMult * constants.leftPaddleSpeed),
  };
};

const nextBallPos = ({ pos, vel }: Ball): Ball => {
  return {
    pos: new Vector(pos.x + vel.x, pos.y + vel.y),
    vel,
  };
};

const movePaddle = (paddle: Paddle, pixelsDown: number): Paddle => {
  const { pos } = paddle;
  return {
    ...paddle,
    pos: new Vector(pos.x, pos.y + pixelsDown),
  };
};

export class Tick implements GameEvent {
  constructor(public readonly elapsed: number) {}

  // Moves the ball based on its velocity
  nextState(prevState: GameState): GameState {
    if (prevState.breakTicks.pauseThisRound()) {
      return prevState.breakTicks.nextState(prevState);
    }
    const collisionsHandled = handleCollisions(prevState);
    const { leftPaddle, ball } = collisionsHandled;
    return {
      ...collisionsHandled,
      leftPaddle: mirrorBall(leftPaddle, ball),
      ball: nextBallPos(ball),
    };
  }
}

const handleBallPaddleCollision = ({ pos, leftToRightApproach }: Paddle, ball: Ball): Ball => {
  const velLeftToRight = ball.vel.x > 0;
  const widthMultiplier = leftToRightApproach ? -1 : 1;

  const xPaddleFront =
    pos.x + (widthMultiplier * constants.paddleWidth) / 2 + constants.ballRadius * widthMultiplier;
  const xPaddleMiddle = pos.x;
  const xCollided =
    ball.pos.x < Math.max(xPaddleFront, xPaddleMiddle) &&
    ball.pos.x > Math.min(xPaddleFront, xPaddleMiddle) &&
    velLeftToRight === leftToRightApproach;

  const yPaddleTop = pos.y + constants.paddleHeight / 2 + constants.ballRadius;
  const yPaddleBottom = pos.y - constants.paddleHeight / 2 - constants.ballRadius;
  const yCollided =
    ball.pos.y < Math.max(yPaddleTop, yPaddleBottom) &&
    ball.pos.y > Math.min(yPaddleTop, yPaddleBottom);

  return xCollided && yCollided;
};

const handleCollisions = (gameState: GameState): GameState => {
  return gameState;
};

export class PaddleMove implements GameEvent {
  constructor(public readonly pixelsDown: number, public readonly isPlayer: boolean) {}

  // Moves paddle
  nextState(prevState: GameState): GameState {
    const prevPaddle = this.isPlayer ? prevState.rightPaddle : prevState.leftPaddle;
    return {
      ...prevState,
      rightPaddle: movePaddle(prevState.rightPaddle, this.pixelsDown),
    };
  }
}

export const constants = {
  ballRadius: 10,
  paddleDist: 10,
  paddleWidth: 10,
  paddleHeight: 50,
  paddleDistFromEdge: 50,
  canvasWidth: 600,
  canvasHeight: 600,
  initialBallVelocity: new Vector(3, 0),
  leftPaddleSpeed: 1.5,
};

export const initialBall = {
  pos: new Vector(100, constants.canvasHeight / 2),
  vel: constants.initialBallVelocity,
};

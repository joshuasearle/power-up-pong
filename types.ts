export type GameState = Readonly<{
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  ball: Ball;
  score: Score;
  breakTicks: BreakTicks;
  gameOver: boolean;
  leftWall: Collidable;
  rightWall: Collidable;
  roof: Collidable;
  floor: Collidable;
}>;

interface Collidable {
  ballCollided: (ball: Ball) => boolean;
  nextState: (gameState: GameState) => GameState;
  type: string;
}

export class Wall implements Collidable {
  constructor(public readonly x: number, public readonly leftToRightApproach: boolean) {}

  ballCollided(ball: Ball) {
    const multiple = this.leftToRightApproach ? 1 : -1;
    const velDir = Math.abs(ball.vel.x) / ball.vel.x;
    return (ball.pos.x - this.x) * multiple > constants.ballRadius && velDir === multiple;
  }
  nextState(gameState: GameState): GameState {
    return {
      ...gameState,
      score: gameState.score - +this.leftToRightApproach,
      breakTicks: new BreakTicks(100),
    };
  }
  public readonly type: string = 'collidable';
}

export class HorizontalSurface implements Collidable {
  constructor(public readonly y: number, public readonly topToBottomApproach: boolean) {}
  ballCollided(ball: Ball) {
    const multiplier = this.topToBottomApproach ? -1 : 1;
    const velTopToBot = ball.vel.y > 0;
    const yInside = this.y + multiplier * constants.ballRadius;
    const yTop = this.y;
    return (
      ball.pos.y < Math.max(yInside, yTop) &&
      ball.pos.y > Math.min(yInside, yTop) &&
      velTopToBot === this.topToBottomApproach
    );
  }

  nextState(gameState: GameState): GameState {
    const { pos, vel } = gameState.ball;
    // Invert y velocity
    return {
      ...gameState,
      ball: new Ball(pos, new Vector(vel.x, -vel.y)),
    };
  }

  public readonly type: string = 'collidable';
}

export class Paddle implements Collidable {
  constructor(
    public readonly id: string,
    public readonly pos: Vector,
    public readonly leftToRightApproach: boolean
  ) {}

  ballCollided(ball: Ball): boolean {
    const velLeftToRight = ball.vel.x > 0;
    const widthMultiplier = this.leftToRightApproach ? -1 : 1;

    const xPaddleFront =
      this.pos.x +
      (widthMultiplier * constants.paddleWidth) / 2 +
      constants.ballRadius * widthMultiplier;
    const xPaddleMiddle = this.pos.x;
    const xCollided =
      ball.pos.x < Math.max(xPaddleFront, xPaddleMiddle) &&
      ball.pos.x > Math.min(xPaddleFront, xPaddleMiddle) &&
      velLeftToRight === this.leftToRightApproach;

    const yPaddleTop = this.pos.y + constants.paddleHeight / 2 + constants.ballRadius;
    const yPaddleBottom = this.pos.y - constants.paddleHeight / 2 - constants.ballRadius;
    const yCollided =
      ball.pos.y < Math.max(yPaddleTop, yPaddleBottom) &&
      ball.pos.y > Math.min(yPaddleTop, yPaddleBottom);

    return xCollided && yCollided;
  }

  nextState(gameState: GameState): GameState {
    const { pos, vel } = gameState.ball;
    return {
      ...gameState,
      ball: gameState.ball.newBallAngle(this),
    };
  }

  ballYOffset(ball: Ball): number {
    return ball.pos.y - this.pos.y;
  }

  movePaddle(pixelsDown: number): Paddle {
    const newY = Math.max(0, Math.min(constants.canvasHeight, this.pos.y + pixelsDown));
    return new Paddle(this.id, new Vector(this.pos.x, newY), this.leftToRightApproach);
  }

  mirrorBall(ball: Ball): Paddle {
    const yOffset = this.pos.y - ball.pos.y;

    // If already inline with ball, do nothing
    if (Math.abs(yOffset) < constants.paddleHeight / 2) {
      return this;
    }
    const directMult = yOffset === 0 ? 0 : -Math.abs(yOffset) / yOffset;
    return new Paddle(
      this.id,
      new Vector(this.pos.x, this.pos.y + directMult * constants.leftPaddleSpeed),
      this.leftToRightApproach
    );
  }

  public readonly type: string = 'collidable';
}

export class Ball {
  constructor(public readonly pos: Vector, public readonly vel: Vector) {}

  nextBallPos() {
    return new Ball(new Vector(this.pos.x + this.vel.x, this.pos.y + this.vel.y), this.vel);
  }

  newBallAngle(paddle: Paddle): Ball {
    const yOffset = this.pos.y - paddle.pos.y;

    const multiplier =
      yOffset === 0 ? 0 : (Math.abs(yOffset) / yOffset) * (Math.abs(this.vel.x) / this.vel.x);

    const offScore =
      multiplier * (Math.abs(yOffset) / (constants.paddleHeight / 2 + constants.ballRadius));

    // Max 45 / -45 change in directory

    const degreesOff = offScore * 60;

    return new Ball(this.pos, this.vel.rotate(180 - degreesOff));
  }
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

export class Tick implements GameEvent {
  constructor(public readonly elapsed: number) {}

  // Moves the ball based on its velocity
  nextState(prevState: GameState): GameState {
    if (prevState.breakTicks.pauseThisRound()) {
      return prevState.breakTicks.nextState(prevState);
    }
    const collisionsHandled = this.handleCollisions(prevState);
    return {
      ...collisionsHandled,
      leftPaddle: prevState.leftPaddle.mirrorBall(prevState.ball),
      ball: collisionsHandled.ball.nextBallPos(),
    };
  }

  handleCollisions = (gameState: GameState): GameState => {
    // TypeScript doesn't have type checking against interfaces
    // Took the word of this random guy on stack overflow
    // (https://stackoverflow.com/questions/14425568/interface-type-check-with-typescript)
    // So added type checking property "type"
    return (
      Object.values(gameState)
        // .filter(gameObj => gameObj.hasOwnProperty('type'))
        .filter((gameObj: Collidable) => gameObj.type === 'collidable')
        .filter((collidable: Collidable) => collidable.ballCollided(gameState.ball))
        .reduce((newState, collidable: Collidable) => collidable.nextState(newState), gameState)
    );
  };
}

export class PaddleMove implements GameEvent {
  constructor(public readonly pixelsDown: number, public readonly isPlayer: boolean) {}

  // Moves paddle
  nextState(prevState: GameState): GameState {
    const prevPaddle = this.isPlayer ? prevState.rightPaddle : prevState.leftPaddle;
    return {
      ...prevState,
      rightPaddle: prevPaddle.movePaddle(this.pixelsDown),
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

export const initialBall = new Ball(
  new Vector(100, constants.canvasHeight / 2),
  constants.initialBallVelocity
);

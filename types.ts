export type GameState = Readonly<{
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  ball: Ball;
  score: Score;
  breakTicks: BreakTicks;
  gameOver: boolean;
}>;

interface Paddle {
  pos: Vector;
}

interface Ball {
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

import { interval, fromEvent, from, zip } from 'rxjs';
import { map, scan, filter, merge, flatMap, take, concat, reduce } from 'rxjs/operators';

import {
  GameState,
  Vector,
  GameEvent,
  Tick,
  KeyEvent,
  PaddleMove,
  Key,
  constants,
  initialBall,
  BreakTicks,
} from './types';
import updateView from './view';

function pong() {
  // Inside this function you will use the classes and functions
  // from rx.js
  // to add visuals to the svg element in pong.html, animate them, and make them interactive.
  // Study and complete the tasks in observable exampels first to get ideas.
  // Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!

  const initialGameState: GameState = {
    leftPaddle: {
      id: 'left',
      pos: new Vector(constants.paddleDistFromEdge, constants.canvasHeight / 2),
      leftToRightApproach: false,
    },
    rightPaddle: {
      id: 'right',
      pos: new Vector(
        constants.canvasWidth - constants.paddleDistFromEdge,
        constants.canvasHeight / 2
      ),
      leftToRightApproach: true,
    },
    ball: initialBall,
    score: 0,
    breakTicks: new BreakTicks(0),
    gameOver: false,
  };

  // Create a tick event every 10ms, and also merge in listeners for the keyboard events
  interval(10)
    .pipe(
      map(elapsed => new Tick(elapsed)),
      merge(startUpMove),
      merge(stopUpMove),
      merge(startDownMove),
      merge(stopDownMove),
      // Reduce state down based on prevstate, and the event
      scan(reduceState, initialGameState)
    )
    // Render the updated state
    .subscribe(updateView);
}

// This function was taken from the "asteroids" example and is not my own
const observeKey = <T>(eventName: KeyEvent, k: Key, result: () => T) => {
  return fromEvent<KeyboardEvent>(document, eventName).pipe(
    filter(({ key }) => key === k),
    // We want repeating holds, so comment this out
    // filter(({ repeat }) => !repeat),
    map(result)
  );
};

const startUpMove = observeKey(
  'keydown',
  'ArrowRight',
  () => new PaddleMove(-constants.paddleDist, true)
);
const stopUpMove = observeKey('keyup', 'ArrowRight', () => new PaddleMove(0, true));

const startDownMove = observeKey(
  'keydown',
  'ArrowLeft',
  () => new PaddleMove(constants.paddleDist, true)
);
const stopDownMove = observeKey('keyup', 'ArrowLeft', () => new PaddleMove(0, true));

const reduceState = (prevState: GameState, event: GameEvent): GameState => {
  // Use GameEvent polymorphism
  return event.nextState(prevState);
};

// the following simply runs your pong function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined') {
  window.onload = () => {
    pong();
  };
}

import { interval, fromEvent } from 'rxjs';
import { map, scan, filter, merge } from 'rxjs/operators';

import { KeyEvent, Key, constants, initialGameState } from './types';
import {
  tickState,
  movePaddle,
  unPause,
  restart,
  tickHandlers,
} from './reducers';
import updateView, { viewUpdaters } from './view';

const startGame = () => {
  // Create a tick event every 10ms
  interval(10)
    .pipe(
      map(elapsed => tickState(tickHandlers)),
      // Merge key press events
      merge(startUpMove),
      merge(startDownMove),
      merge(spaceHit),
      merge(rHit),
      // Reduce state down based on prevstate, and the event
      scan((prevState, event) => event(prevState), initialGameState)
    )
    // Render the updated state
    .subscribe(updateView(viewUpdaters));
};

// This function was inspired from the "asteroids" example (slightly altered),
// so credit goes to Tim Dwyer
const observeKey = (keyEvent: KeyEvent) => (k: Key) => mapTo => {
  return fromEvent<KeyboardEvent>(document, keyEvent).pipe(
    filter(({ key }) => key === k),
    map(() => mapTo)
  );
};

// These take streams of input from the keys, and map the key presses to movePaddle functions
const startUpMove = observeKey('keydown')('ArrowRight')(
  movePaddle(-constants.paddleDist)
);

const startDownMove = observeKey('keydown')('ArrowLeft')(
  movePaddle(constants.paddleDist)
);

// Listens on space and r key, and maps them to functions
const spaceHit = observeKey('keydown')(' ')(unPause);
const rHit = observeKey('keydown')('r')(restart);

export default startGame;

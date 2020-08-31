import { GameState, Paddle, Ball, constants } from './types';

const updateView = (gameState: GameState): void => {
  const canvas = document.getElementById('canvas')!;
  const paddleUpdater = updatePaddle(canvas);
  paddleUpdater(gameState.leftPaddle);
  paddleUpdater(gameState.rightPaddle);

  const ballUpdater = updateBall(canvas);
  ballUpdater(gameState.ball);
};

const updatePaddle = (canvas: HTMLElement) => (paddle: Paddle) => {
  const htmlPaddle = document.getElementById(paddle.id) || createPaddle(paddle, canvas);
  htmlPaddle.setAttribute('x', String(paddle.pos.x - constants.paddleWidth / 2));
  htmlPaddle.setAttribute('y', String(paddle.pos.y - constants.paddleHeight / 2));
};

const updateBall = (canvas: HTMLElement) => (ball: Ball) => {
  const htmlBall = document.getElementById('ball') || createBall(ball, canvas);
  htmlBall.setAttribute('cx', String(ball.pos.x));
  htmlBall.setAttribute('cy', String(ball.pos.y));
};

const createPaddle = (paddle: Paddle, canvas: HTMLElement): Element => {
  const htmlPaddle = document.createElementNS(canvas.namespaceURI, 'rect');
  htmlPaddle.setAttribute('id', paddle.id);
  htmlPaddle.classList.add('paddle');
  htmlPaddle.setAttribute('width', String(constants.paddleWidth));
  htmlPaddle.setAttribute('height', String(constants.paddleHeight));
  canvas.appendChild(htmlPaddle);
  return htmlPaddle;
};

const createBall = (ball: Ball, canvas: HTMLElement): Element => {
  const htmlBall = document.createElementNS(canvas.namespaceURI, 'circle');
  htmlBall.setAttribute('id', 'ball');
  htmlBall.classList.add('ball');
  htmlBall.setAttribute('r', String(constants.ballRadius));
  canvas.appendChild(htmlBall);
  return htmlBall;
};

export default updateView;

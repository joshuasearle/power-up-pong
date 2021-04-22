import {
  GameState,
  Paddle,
  Ball,
  constants,
  PaddleType,
  ViewRenderer,
} from './types';

const updatePaddle = (paddleType: PaddleType) => (canvas: HTMLElement) => (
  gameState: GameState
) => {
  const paddle =
    paddleType === 'left' ? gameState.leftPaddle : gameState.rightPaddle;
  const htmlPaddle =
    document.getElementById(paddle.id) || createPaddle(paddle, canvas);
  htmlPaddle.setAttribute(
    'x',
    String(paddle.pos.x - constants.paddleWidth / 2)
  );
  htmlPaddle.setAttribute(
    'y',
    String(paddle.pos.y - constants.paddleHeight / 2)
  );
  htmlPaddle.setAttribute('fill', paddle.powerShotMode ? 'yellow' : 'white');
};

const updateBall = (canvas: HTMLElement) => (gameState: GameState) => {
  const ball = gameState.ball;
  const gameStart = gameState.gameStarted;
  const htmlBall = document.getElementById('ball') || createBall(ball, canvas);
  htmlBall.setAttribute('visibility', gameStart ? 'visible' : 'hidden');
  htmlBall.setAttribute('cx', String(ball.pos.x));
  htmlBall.setAttribute('cy', String(ball.pos.y));
  htmlBall.setAttribute('fill', ball.colour);
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

const createText = (id: string, canvas: HTMLElement): Element => {
  const htmlText = document.createElementNS(canvas.namespaceURI, 'text');
  htmlText.setAttribute('id', id);
  htmlText.classList.add(id);
  canvas.appendChild(htmlText);
  return htmlText;
};

const renderText = (
  text: string,
  id: string,
  x: number,
  y: number,
  size: number,
  canvas: HTMLElement
) => {
  const htmlText = document.getElementById(id) || createText(id, canvas);
  htmlText.innerHTML = text;
  htmlText.setAttribute('x', String(x));
  htmlText.setAttribute('y', String(y));
  htmlText.setAttribute('font-size', `${size}rem`);
  htmlText.setAttribute('visibility', 'visible');
};

const hideText = (id: string, canvas: HTMLElement) => {
  const htmlText = document.getElementById(id) || createText(id, canvas);
  htmlText.setAttribute('visibility', 'hidden');
};

const updateScore = (canvas: HTMLElement) => (gameState: GameState) => {
  const score = gameState.score;
  renderText(
    `${score.leftPlayer} : ${score.rightPlayer}`,
    'score',
    (constants.canvasWidth - 155.67) / 2,
    80,
    5,
    canvas
  );
};

const updateGameStarted = (canvas: HTMLElement) => (gameState: GameState) => {
  const gameStarted = gameState.gameStarted;
  if (gameStarted) return hideText('welcome-message', canvas);
  renderText(
    'Welcome to Pong',
    'welcome-message',
    (constants.canvasWidth - 441) / 2,
    constants.canvasHeight / 2,
    3.5,
    canvas
  );
};

const updateGameOver = (canvas: HTMLElement) => (gameState: GameState) => {
  const gameOver = gameState.gameOver;
  const score = gameState.score;
  if (!gameOver) {
    return hideText('game-over', canvas);
  }
  renderText(
    `${score.leftPlayer > score.rightPlayer ? 'Left' : 'Right'} is the winner!`,
    'game-over',
    (constants.canvasWidth - 376) / 2,
    constants.canvasHeight / 2,
    3,
    canvas
  );
};

const updateNewGameMessage = (canvas: HTMLElement) => (
  gameState: GameState
) => {
  const gameOver = gameState.gameOver;
  const gameStarted = gameState.gameStarted;
  if (!gameOver && gameStarted) return hideText('new-game', canvas);
  renderText(
    `Press &ltspace&gt to start a new game...`,
    'new-game',
    (constants.canvasWidth - 424) / 2,
    constants.canvasHeight / 2 + 40,
    1.6,
    canvas
  );
};

const removePowerUp = (canvas: HTMLElement) => {
  const htmlPowerUp =
    document.getElementById('powerUp') || createPowerUp(canvas);
  canvas.removeChild(htmlPowerUp);
};

const updatePowerUp = (canvas: HTMLElement) => (gameState: GameState) => {
  const powerUp = gameState.powerUpPresent;
  if (powerUp === null) return removePowerUp(canvas);
  const htmlPowerUp =
    document.getElementById('powerUp') || createPowerUp(canvas);
  htmlPowerUp.setAttribute('cx', String(powerUp.pos.x));
  htmlPowerUp.setAttribute('cy', String(powerUp.pos.y));
  htmlPowerUp.setAttribute('fill', powerUp.colour);
};

const createPowerUp = (canvas: HTMLElement) => {
  const htmlPowerUp = document.createElementNS(canvas.namespaceURI, 'circle');
  htmlPowerUp.setAttribute('id', 'powerUp');
  htmlPowerUp.classList.add('powerUp');
  htmlPowerUp.setAttribute('r', String(constants.powerUpRadius));
  canvas.appendChild(htmlPowerUp);
  return htmlPowerUp;
};

export const viewUpdaters: ViewRenderer[] = [
  updatePaddle('left'),
  updatePaddle('right'),
  updateBall,
  updateScore,
  updateGameStarted,
  updateGameOver,
  updateNewGameMessage,
  updatePowerUp,
];

const updateView = (viewUpdaters: ViewRenderer[]) => (
  gameState: GameState
): void => {
  const canvas = document.getElementById('canvas')!;
  // Indivdiually update all of the components
  viewUpdaters
    .map((updater: ViewRenderer) => updater(canvas))
    .forEach(updater => updater(gameState));
};

export default updateView;

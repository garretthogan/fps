// import CollisionWorldGame from './CollisionWorld';
// import { initGUI } from './gui';
// import { registerLobbyHandler } from './lobby';

import World from './engine/World';

// const socket = io();

// const game = new CollisionWorldGame(socket);
// game.init();
// game.update();

// initGUI(socket);

// registerLobbyHandler(socket);

const gameWorld = new World();
gameWorld.update();

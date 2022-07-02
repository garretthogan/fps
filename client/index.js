import Lobby from './engine/Lobby';
import World from './engine/World';

const socket = io();

const lobby = new Lobby(socket);

const gameWorld = new World();
gameWorld.update();

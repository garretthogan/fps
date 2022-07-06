import Lobby from './engine/Lobby';
import World from './engine/World';

const joinCode = window.location.pathname.split('/')[1];
const lobby = new Lobby(joinCode);

const gameWorld = new World(lobby);
gameWorld.update();

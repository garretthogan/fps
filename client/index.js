import Lobby from './engine/Lobby';
import World from './engine/World';

console.log(window.location.pathname);
const pathName = window.location.pathname;

const mapName = pathName.includes('map') ? pathName.split('/')[2] : null;
const joinCode = pathName.includes('join') ? pathName.split('/')[2] : null;

const lobby = new Lobby(joinCode, mapName);
const gameWorld = new World(lobby, mapName);
gameWorld.update();

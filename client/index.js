import Lobby from './engine/Lobby';
import World from './engine/World';

const pathName = window.location.pathname;
const isJoining = pathName.includes('join');
const isCreating = pathName.includes('maps');

const mapName = isCreating ? pathName.split('/')[2] : null;
const joinCode = isJoining ? pathName.split('/')[2] : null;

const lobby = new Lobby(joinCode, mapName);
new World(lobby);

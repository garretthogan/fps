import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { CLIENT_CREATE_LOBBY, CLIENT_JOIN_LOBBY } from '../utils/events';
import Lobby from './engine/Lobby';
import { RemotePlayerManager } from './engine/RemotePlayer';
import World from './engine/World';

const socket = io();
const lobby = new Lobby(socket);
const gameWorld = new World(socket, lobby);
const rpm = new RemotePlayerManager(gameWorld, lobby, socket);

const gui = new GUI({ width: 200, title: 'Menu' });

gui.add(
	{
		fullscreen: () => {
			document.body.requestFullscreen();
			document.body.addEventListener('mousedown', () => {
				document.body.requestPointerLock();
			});
		},
	},
	'fullscreen'
);

gui.add({ username: 'username' }, 'username').onChange((username) => {
	lobby.username = username;
});

const folder = gui.addFolder('Create');
const folderParams = {
	lobbyName: 'lobbyName',
	create: () => {
		lobby.created = true;
		socket.emit(CLIENT_CREATE_LOBBY, lobby.username, folderParams.lobbyName);
		folder.hide();
		joinFolder.hide();
	},
};

folder.add(folderParams, 'lobbyName');
folder.add(folderParams, 'create');

const joinFolder = gui.addFolder('Join');
const joinFolderParams = {
	joinKey: 'joinKey',
	join: () => {
		lobby.joinFromLocal = true;
		socket.emit(CLIENT_JOIN_LOBBY, lobby.username, joinFolderParams.joinKey);
		folder.hide();
		joinFolder.hide();
	},
};

joinFolder.add(joinFolderParams, 'joinKey');
joinFolder.add(joinFolderParams, 'join');

gameWorld.update();

/**
 * Game Idea Graveyard: these will rise from the dead
 * - slaughter island: small chunk map on top of nice water shader
 *    where players duel to the death (sort of smash bros x valorant)
 */

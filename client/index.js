import copy from 'copy-to-clipboard';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import {
	CLIENT_CREATE_LOBBY,
	CLIENT_JOIN_LOBBY,
	SERVER_CLIENT_JOINED,
	SERVER_LOBBY_CREATED,
	SERVER_UPDATE_POSITION,
} from '../utils/events';
import Lobby from './engine/Lobby';
import World from './engine/World';

const lobby = new Lobby();

// socket stuff
const ws = new WebSocket('ws://localhost:3535');
const gameWorld = new World(ws, lobby);
ws.onopen = () => {
	console.log('connection established');
};
ws.onmessage = (message) => {
	const event = JSON.parse(message.data);

	switch (event.type) {
		case SERVER_LOBBY_CREATED:
			lobby.localClientId = event.data.clientId;
			lobby.joinCode = event.data.lobbyId;
			lobby.lobbyName = event.data.lobbyId;
			copy(lobby.joinCode);
			console.log('you created a lobby!', lobby.lobbyName);
			break;

		case SERVER_CLIENT_JOINED:
			if (!lobby.localClientId) {
				lobby.localClientId = event.data.clientId;
				lobby.joinCode = event.data.lobbyId;
				lobby.lobbyName = event.data.lobbyId;
				copy(lobby.joinCode);
			}
			lobby.connectedClients = event.data.connectedClientIds;
			console.log('connected clients', lobby.connectedClients);

		case SERVER_UPDATE_POSITION:
			if (event.data.clientId !== lobby.localClientId) {
				// update associate remote player position
			} else if (event.data.clientId === lobby.localClientId) {
				// this is our own update so ignore it probably
			}
			break;
	}
};

// ui stuff
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
		ws.send(JSON.stringify({ type: CLIENT_CREATE_LOBBY, data: { owner: lobby.username } }));
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
		ws.send(JSON.stringify({ type: CLIENT_JOIN_LOBBY, data: { lobbyId: joinFolderParams.joinKey } }));
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

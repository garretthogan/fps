import copy from 'copy-to-clipboard';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { SERVER_LOBBY_CREATED, SERVER_PLAYER_JOINED, SERVER_START_GAME, SERVER_UPDATE_POSITION } from '../utils/events';
import { initGame } from './game';
import { setJoinKey, setLocalPlayerId } from './gui';
import { updatePosition } from './player';

const lobbyData = {
	lobbyName: null,
	owner: null,
	players: [],
	joinKey: null,
	localPlayerId: null,
};

export function getLocalPlayerId() {
	return lobbyData.localPlayerId;
}

export function getKey() {
	return lobbyData.joinKey;
}

export function registerLobbyHandler(socket) {
	const gui = new GUI({ width: 200, title: 'Join Code' });
	socket.on(SERVER_LOBBY_CREATED, (serverLobbyData) => {
		lobbyData.lobbyName = serverLobbyData.lobbyName;
		lobbyData.owner = serverLobbyData.owner;
		lobbyData.players = serverLobbyData.players;
		lobbyData.joinKey = serverLobbyData.joinKey;
		lobbyData.localPlayerId = serverLobbyData.owner;

		setJoinKey(lobbyData.joinKey);
		setLocalPlayerId(lobbyData.owner);
		copy(lobbyData.joinKey);

		console.log('join key copied to clipdboard!', lobbyData.joinKey);
	});
	socket.on(SERVER_PLAYER_JOINED, (pid, serverLobbyData) => {
		lobbyData.lobbyName = serverLobbyData.lobbyName;
		lobbyData.owner = serverLobbyData.owner;
		lobbyData.players = serverLobbyData.players;
		lobbyData.joinKey = serverLobbyData.joinKey;

		if (!lobbyData.localPlayerId) {
			lobbyData.localPlayerId = pid;
			setLocalPlayerId(pid);
		}

		console.log('player joined lobby', pid, lobbyData);
	});
	socket.on(SERVER_UPDATE_POSITION, (pid, position) => {
		if (lobbyData.localPlayerId === pid) return;

		updatePosition(pid, position);
	});
	socket.on(SERVER_START_GAME, (players) => {
		console.log({ players });
		initGame(players);
	});
}

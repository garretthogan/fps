import { SERVER_LOBBY_CREATED, SERVER_PLAYER_JOINED, SERVER_START_GAME, SERVER_UPDATE_POSITION } from '../utils/events';
import { initGame } from './game';

const lobbyData = {
	lobbyName: null,
	owner: null,
	players: [],
	joinKey: null,
	localPlayerId: null,
};

const dummies = {};

export function getLocalPlayerId() {
	return lobbyData.localPlayerId;
}

export function getKey() {
	return lobbyData.joinKey;
}

export function getPlayerPosition(pid) {
	return dummies[pid];
}

export function getPlayerTransforms() {
	return dummies;
}

export function registerLobbyHandler(socket) {
	socket.on(SERVER_LOBBY_CREATED, (serverLobbyData) => {
		lobbyData.lobbyName = serverLobbyData.lobbyName;
		lobbyData.owner = serverLobbyData.owner;
		lobbyData.players = serverLobbyData.players;
		lobbyData.joinKey = serverLobbyData.joinKey;
		lobbyData.localPlayerId = lobbyData.owner;

		console.log('lobby data updated', lobbyData);
	});
	socket.on(SERVER_PLAYER_JOINED, (pid, serverLobbyData) => {
		lobbyData.lobbyName = serverLobbyData.lobbyName;
		lobbyData.owner = serverLobbyData.owner;
		lobbyData.players = serverLobbyData.players;
		lobbyData.joinKey = serverLobbyData.joinKey;

		if (!lobbyData.localPlayerId) {
			lobbyData.localPlayerId = pid;
		}

		console.log('player joined lobby', pid, lobbyData);
	});
	socket.on(SERVER_UPDATE_POSITION, (pid, position) => {
		if (lobbyData.localPlayerId === pid) return;

		dummies[pid] = position;
	});
	socket.on(SERVER_START_GAME, (players) => {
		console.log({ players });
		initGame(players, dummies);
	});
}

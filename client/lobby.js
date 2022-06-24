import { SERVER_LOBBY_CREATED, SERVER_PLAYER_JOINED } from '../utils/events';

const lobbyData = {
	lobbyName: null,
	owner: null,
	players: [],
	joinKey: null,
	localPlayerId: null,
};

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
}

const shortid = require('shortid');
const {
	CLIENT_CREATE_LOBBY,
	SERVER_LOBBY_CREATED,
	CLIENT_JOIN_LOBBY,
	SERVER_PLAYER_JOINED,
	FAILED_TO_JOIN,
	NO_LOBBY,
	CLIENT_UPDATE_POSITION,
	SERVER_UPDATE_POSITION,
	CLIENT_START_GAME,
	SERVER_START_GAME,
} = require('../utils/events');

const serverLobbies = {};

function generate() {
	return shortid.generate().replace('_', ':');
}

function serverLobbyHandler(io, socket) {
	socket.on(CLIENT_CREATE_LOBBY, (username, lobbyName) => {
		const pid = `${username}_${generate()}`;
		const joinKey = `${lobbyName}_${generate()}`;

		serverLobbies[joinKey] = { lobbyName, owner: pid, joinKey, players: [pid] };
		socket.join(joinKey);
		io.to(joinKey).emit(SERVER_LOBBY_CREATED, serverLobbies[joinKey]);
	});
	socket.on(CLIENT_JOIN_LOBBY, (username, joinKey) => {
		const pid = `${username}_${generate()}`;
		if (serverLobbies[joinKey]) {
			serverLobbies[joinKey].players.push(pid);
			socket.join(joinKey);
			io.to(joinKey).emit(SERVER_PLAYER_JOINED, pid, serverLobbies[joinKey]);
		} else {
			socket.join(pid);
			io.to(pid).emit(FAILED_TO_JOIN, NO_LOBBY);
		}
	});
	socket.on(CLIENT_UPDATE_POSITION, (lobbyKey, pid, position) => {
		io.to(lobbyKey).emit(SERVER_UPDATE_POSITION, pid, position);
	});
	socket.on(CLIENT_START_GAME, (lobbyKey) => {
		io.to(lobbyKey).emit(SERVER_START_GAME, serverLobbies[lobbyKey].players);
	});
}

module.exports = { serverLobbyHandler };

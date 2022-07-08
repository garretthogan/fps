const events = {
	SERVER_START_GAME: 'server start game',
	OWNER_START_GAME: 'owner start game',
	CLIENT_START_GAME: 'client start game',
	CLIENT_JOIN_ROOM: 'client join room',
	SERVER_JOIN_ROOM: 'server join room',
	OWNER_JOIN_ROOM: 'owner join room',
	CLIENT_CREATE_ROOM: 'client create room',
	SERVER_PLAYER_JOINED: 'server player joined',
	CLIENT_UPDATE_POSITION: 'client update position',
	SERVER_UPDATE_POSITION: 'server update position',
	SERVER_UPDATE_ROTATION: 'server update rotation',
	SERVER_ROOM_CREATED: 'server room created',
	CLIENT_CREATE_LOBBY: 'client create lobby',
	SERVER_LOBBY_CREATED: 'server lobby created',
	CLIENT_JOIN_LOBBY: 'client join lobby',
	FAILED_TO_JOIN: 'failed to join',
	NO_LOBBY: 'lobby does not exist',
	SERVER_CLIENT_JOINED: 'server client joined',
	CLIENT_UPDATE_ROTATION: 'client update rotation',
	LOAD_MAP: 'load map',
};

module.exports = events;

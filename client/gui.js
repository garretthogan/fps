import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { CLIENT_CREATE_LOBBY, CLIENT_JOIN_LOBBY, CLIENT_START_GAME } from '../utils/events';
import { getKey } from './lobby';

const guiData = {
	username: null,
	created: false,
	joinFromLocal: false,
	joinKey: null,
	localPlayerId: null,
	playerIdEl: null,
	joinKeyEl: null,
};

export function setJoinKey(key) {
	guiData.joinKey = key;
	guiData.joinKeyEl.innerText = `Key: ${key}`;
}

export function setLocalPlayerId(pid) {
	guiData.localPlayerId = pid;
	guiData.playerIdEl.innerText = `PID: ${pid}`;
}

export function initGUI(socket) {
	guiData.playerIdEl = document.getElementById('player-id');
	guiData.joinKeyEl = document.getElementById('join-key');

	const gui = new GUI({ width: 200, title: 'Menu' });
	gui.add({ username: 'username' }, 'username').onChange((username) => {
		guiData.username = username;
	});

	const folder = gui.addFolder('Create');
	const folderParams = {
		lobbyName: 'lobbyName',
		create() {
			guiData.created = true;
			socket.emit(CLIENT_CREATE_LOBBY, guiData.username, folderParams.lobbyName);
			folder.hide();
			joinFolder.hide();
		},
	};

	folder.add(folderParams, 'lobbyName');
	folder.add(folderParams, 'create');

	const joinFolder = gui.addFolder('Join');
	const joinFolderParams = {
		joinKey: 'joinKey',
		join() {
			guiData.joinFromLocal = true;
			socket.emit(CLIENT_JOIN_LOBBY, guiData.username, joinFolderParams.joinKey);
			folder.hide();
			joinFolder.hide();
		},
	};

	joinFolder.add(joinFolderParams, 'joinKey');
	joinFolder.add(joinFolderParams, 'join');

	gui.add(
		{
			start: () => {
				const key = getKey();
				if (!key || !guiData.created) {
					console.log('create a lobby first!');
				} else {
					console.log('start game');
					socket.emit(CLIENT_START_GAME, key);
				}
			},
		},
		'start'
	);
}

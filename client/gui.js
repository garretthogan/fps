import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { CLIENT_CREATE_LOBBY, CLIENT_JOIN_LOBBY, CLIENT_START_GAME } from '../utils/events';
import { getKey } from './lobby';

const guiData = {
	username: null,
	created: false,
	joinFromLocal: false,
};

export function initGUI(socket) {
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

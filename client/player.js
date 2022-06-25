import { Object3D } from 'three';

class PlayerData {
	constructor(mesh, owner, transform) {
		this.mesh = mesh;
		this.owner = owner;
		this.transform = transform;
	}
}

const DRONE = 'drone.glb';

const remotePlayers = {};
const transforms = {};

export function getTransforms() {
	return transforms;
}

export function updatePosition(pid, position) {
	transforms[pid] = position;
}

export function spawnRemotePlayer(loader, scene, pid) {
	const playerTransform = new Object3D();
	scene.add(playerTransform);

	loader.load(DRONE, (gltf) => {
		const newPlayerData = new PlayerData();
		newPlayerData.mesh = gltf.scene;
		newPlayerData.owner = pid;

		const t = transforms[pid];
		playerTransform.position.set(t.x, t.y, t.z);

		newPlayerData.mesh.scale.set(0.005, 0.005, 0.005);
		playerTransform.add(newPlayerData.mesh);

		newPlayerData.transform = playerTransform;
		newPlayerData.mesh.position.set(0, 0, 0);

		remotePlayers[pid] = newPlayerData;
	});
}

export function spawnRemotePlayers(loader, scene, playerIds) {
	playerIds.map((pid) => spawnRemotePlayer(loader, scene, pid));
}

export function updateRemotePlayers() {
	const playerIds = Object.keys(remotePlayers);
	playerIds.map((pid) => {
		const rp = remotePlayers[pid];
		const t = transforms[rp.owner];
		rp.transform.position.set(t.x, t.y, t.z);
	});
}

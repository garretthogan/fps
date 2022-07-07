import { Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Capsule } from 'three/examples/jsm/math/Capsule';

function loadMesh(root, file) {
	const loader = new GLTFLoader().setPath('./models/');
	loader.load(file, (gltf) => {
		root.add(gltf.scene);
		gltf.scene.scale.set(0.005, 0.005, 0.005);

		gltf.scene.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;

				if (child.material.map) {
					child.material.map.anisotropy = 4;
				}
			}
		});
	});
}

const FLOOR = 2;

export class RemotePlayer {
	// pass an initial position for the mesh
	constructor(owningClientId) {
		this.owner = owningClientId;

		const height = 1.5;
		this.root = new Object3D();
		this.meshParent = new Object3D();
		this.isOnFloor = true;
		this.collider = new Capsule(new Vector3(0, FLOOR, -2), new Vector3(0, FLOOR + height, -2), 0.35);
		this.velocity = new Vector3();
		this.direction = new Vector3();
		this.root.add(this.meshParent);

		loadMesh(this.meshParent, 'drone.glb');
	}
}

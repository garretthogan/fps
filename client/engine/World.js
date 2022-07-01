/** To do:
 * - refactor player into its own class
 * - abstract collision to its own component
 * - abstract input handling to something
 *
 */

import {
	ACESFilmicToneMapping,
	Clock,
	Color,
	DirectionalLight,
	Fog,
	HemisphereLight,
	IcosahedronGeometry,
	Mesh,
	MeshLambertMaterial,
	Object3D,
	PerspectiveCamera,
	Scene,
	Sphere,
	sRGBEncoding,
	Vector3,
	VSMShadowMap,
	WebGLRenderer,
} from 'three';
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { Octree } from 'three/examples/jsm/math/Octree';

function spawnLights(scene) {
	const fillLight = new HemisphereLight(0x4488bb, 0x002244, 0.5);
	fillLight.position.set(2, 1, 1);

	scene.add(fillLight);

	const directionalLight = new DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(-5, 25, -1);
	directionalLight.castShadow = true;
	directionalLight.shadow.camera.near = 0.01;
	directionalLight.shadow.camera.far = 500;
	directionalLight.shadow.camera.right = 30;
	directionalLight.shadow.camera.left = -30;
	directionalLight.shadow.camera.top = 30;
	directionalLight.shadow.camera.bottom = -30;
	directionalLight.shadow.mapSize.width = 1024;
	directionalLight.shadow.mapSize.height = 1024;
	directionalLight.shadow.radius = 4;
	directionalLight.shadow.bias = -0.00006;
	scene.add(directionalLight);
}

function loadLevel(scene, worldOctree, file = 'collision-world.glb') {
	const loader = new GLTFLoader().setPath('./models/');
	loader.load(file, (gltf) => {
		scene.add(gltf.scene);

		worldOctree.fromGraphNode(gltf.scene);

		gltf.scene.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;

				if (child.material.map) {
					child.material.map.anisotropy = 4;
				}
			}
		});

		const helper = new OctreeHelper(worldOctree);
		helper.visible = false;
		scene.add(helper);
	});
}

let sphereIdx = 0;
const SPHERE_RADIUS = 0.2;
const sphereGeometry = new IcosahedronGeometry(SPHERE_RADIUS, 5);
const sphereMaterial = new MeshLambertMaterial({ color: 0xbbbb44 });
const spheres = [];

const vector1 = new Vector3();
const vector2 = new Vector3();
const vector3 = new Vector3();
function populateProjectilePool(scene, size) {
	for (let i = 0; i < size; i++) {
		const sphere = new Mesh(sphereGeometry, sphereMaterial);
		sphere.castShadow = true;
		sphere.receiveShadow = true;

		scene.add(sphere);

		spheres.push({
			mesh: sphere,
			collider: new Sphere(new Vector3(0, -100, 0), SPHERE_RADIUS),
			velocity: new Vector3(),
		});
	}
}

const RT = 3;
const LT = 2;

const FLOOR = -1.75;
const GRAVITY = 30;

export default class World {
	constructor() {
		this.keyCodes = {};
		this.rtUp = true;
		this.ltUp = true;

		document.body.addEventListener('keydown', (e) => this.onKeyDown(e.code));
		document.body.addEventListener('keyup', (e) => this.onKeyUp(e.code));
		document.body.addEventListener('mousedown', () => {
			document.body.requestPointerLock();
			// document.body.requestFullscreen();
		});
		document.body.addEventListener('mousemove', (e) => this.onMouseMove(e.movementX, e.movementY));
		window.addEventListener('resize', this.onWindowResize.bind(this));

		this.clock = new Clock();
		this.worldOctree = new Octree();

		this.scene = new Scene();
		this.scene.background = new Color(0x88ccee);
		this.scene.fog = new Fog(0x88ccee, 0, 50);

		const playerHeight = 1.5;
		this.canPlayerThrow = true;
		this.player = new Object3D();
		this.cameraParent = new Object3D();
		this.playerOnFloor = true;
		this.playerCamera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 1000);
		this.playerCollider = new Capsule(new Vector3(0, FLOOR, -2), new Vector3(0, FLOOR + playerHeight, -2), 0.35);
		this.playerVelocity = new Vector3();
		this.playerDirection = new Vector3();
		this.cameraParent.add(this.playerCamera);
		this.player.add(this.cameraParent);
		this.scene.add(this.player);

		this.renderer = new WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = VSMShadowMap;
		this.renderer.outputEncoding = sRGBEncoding;
		this.renderer.toneMapping = ACESFilmicToneMapping;

		spawnLights(this.scene);
		populateProjectilePool(this.scene, 10);
		loadLevel(this.scene, this.worldOctree, 'collision-world.glb');

		const container = document.getElementById('game-container');
		container.appendChild(this.renderer.domElement);
	}

	onMouseMove(x, y) {
		this.cameraParent.rotation.y -= x / 500;
	}

	onKeyDown(keyCode) {
		this.keyCodes[keyCode] = true;
	}
	onKeyUp(keyCode) {
		this.keyCodes[keyCode] = false;
	}

	onRightTriggerDown() {
		console.log('RT down');
		this.rtUp = false;

		const sphere = spheres[sphereIdx];

		this.playerCamera.getWorldDirection(this.playerDirection);

		sphere.collider.center
			.copy(this.playerCollider.end)
			.addScaledVector(this.playerDirection, this.playerCollider.radius * 1.5);

		const impulse = 15 + 30 * (1 * 0.75);

		sphere.velocity.copy(this.playerDirection).multiplyScalar(impulse);
		sphere.velocity.addScaledVector(this.playerVelocity, 2);

		sphereIdx = (sphereIdx + 1) % spheres.length;
	}
	onRightTriggerUp() {
		console.log('RT up');
		this.rtUp = true;
	}
	onLeftTriggerDown() {
		console.log('LT down');
		this.ltUp = false;
	}
	onLeftTriggerUp() {
		console.log('LT up');
		this.ltUp = true;
	}

	getForwardVector() {
		this.playerCamera.getWorldDirection(this.playerDirection);
		this.playerDirection.y = 0;
		this.playerDirection.normalize();

		return this.playerDirection;
	}
	getSideVector() {
		this.playerCamera.getWorldDirection(this.playerDirection);
		this.playerDirection.y = 0;
		this.playerDirection.normalize();
		this.playerDirection.cross(this.playerCamera.up);

		return this.playerDirection;
	}

	updateKeyboardInput(dt) {
		// keyboard input
		const speedDelta = dt * (this.playerOnFloor ? 15 : 8);

		if (this.keyCodes['KeyW']) {
			this.playerVelocity.add(this.getForwardVector().multiplyScalar(speedDelta));
		}

		if (this.keyCodes['KeyS']) {
			this.playerVelocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
		}

		if (this.keyCodes['KeyA']) {
			this.playerVelocity.add(this.getSideVector().multiplyScalar(-speedDelta));
		}

		if (this.keyCodes['KeyD']) {
			this.playerVelocity.add(this.getSideVector().multiplyScalar(speedDelta));
		}
	}

	updateGamepadInput(dt) {
		const gamepad = navigator.getGamepads()[0];
		if (gamepad) {
			const buttons = gamepad.buttons;
			const axes = gamepad.axes;
			const faceButtons = buttons.slice(0, 4);

			const triggers = buttons.slice(4, 8);
			if (triggers[RT].pressed && this.rtUp) {
				this.onRightTriggerDown();
			} else if (!triggers[RT].pressed && !this.rtUp) {
				this.onRightTriggerUp();
			}

			if (triggers[LT].pressed && this.ltUp) {
				this.onLeftTriggerDown();
			} else if (!triggers[LT].pressed && !this.ltUp) {
				this.onLeftTriggerUp();
			}

			// controller movement
			const speedDelta = dt * (this.playerOnFloor ? 15 : 8);

			const lStick = [axes[0], axes[1]];
			const rStick = [axes[2], axes[3]];

			const lHorizontal = lStick[0];
			const lVertical = -1 * lStick[1];

			const lVertTrunc = lVertical < -0.2 || lVertical > 0.2 ? lVertical : 0;
			const lHorizontalTrunc = lHorizontal < -0.2 || lHorizontal > 0.2 ? lHorizontal : 0;

			this.playerVelocity.add(this.getForwardVector().multiplyScalar(speedDelta * lVertTrunc));
			this.playerVelocity.add(this.getSideVector().multiplyScalar(speedDelta * lHorizontalTrunc));

			const rHorizontal = rStick[0];
			const rVertical = rStick[1];

			const rVertTrunc = rVertical < -0.2 || rVertical > 0.2 ? rVertical : 0;
			const rHorizontalTrunc = rHorizontal < -0.2 || rHorizontal > 0.2 ? rHorizontal : 0;

			this.player.rotation.y -= (rHorizontalTrunc * 2) / 100;
			this.playerCamera.rotation.x -= (rVertTrunc * 2) / 100;
		}
	}

	updatePlayer(dt) {
		this.updateKeyboardInput(dt);
		this.updateGamepadInput(dt);

		// player movement
		let damping = Math.exp(-4 * dt) - 1;

		if (!this.playerOnFloor) {
			this.playerVelocity.y -= GRAVITY * dt;

			// small air resistance
			damping *= 0.1;
		}
		this.playerVelocity.addScaledVector(this.playerVelocity, damping);

		const deltaPosition = this.playerVelocity.clone().multiplyScalar(dt);
		this.playerCollider.translate(deltaPosition);

		this.player.position.copy(this.playerCollider.end);

		// player collisions
		const result = this.worldOctree.capsuleIntersect(this.playerCollider);

		this.playerOnFloor = false;

		if (result) {
			this.playerOnFloor = result.normal.y > 0;

			if (!this.playerOnFloor) {
				this.playerVelocity.addScaledVector(result.normal, -result.normal.dot(this.playerVelocity));
			}

			this.playerCollider.translate(result.normal.multiplyScalar(result.depth));
		}
	}

	updateProjectiles(dt) {
		spheres.forEach((sphere) => {
			sphere.collider.center.addScaledVector(sphere.velocity, dt);

			const result = this.worldOctree.sphereIntersect(sphere.collider);

			if (result) {
				sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
				sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
			} else {
				sphere.velocity.y -= GRAVITY * dt;
			}

			const damping = Math.exp(-1.5 * dt) - 1;
			sphere.velocity.addScaledVector(sphere.velocity, damping);
		});

		// sphere collisions
		for (let i = 0, length = spheres.length; i < length; i++) {
			const s1 = spheres[i];

			for (let j = i + 1; j < length; j++) {
				const s2 = spheres[j];

				const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
				const r = s1.collider.radius + s2.collider.radius;
				const r2 = r * r;

				if (d2 < r2) {
					const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
					const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
					const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

					s1.velocity.add(v2).sub(v1);
					s2.velocity.add(v1).sub(v2);

					const d = (r - Math.sqrt(d2)) / 2;

					s1.collider.center.addScaledVector(normal, d);
					s2.collider.center.addScaledVector(normal, -d);
				}
			}
		}

		for (const sphere of spheres) {
			sphere.mesh.position.copy(sphere.collider.center);
		}
	}

	update() {
		const STEPS_PER_FRAME = 3;
		const dt = Math.min(0.05, this.clock.getDelta()) / STEPS_PER_FRAME;

		for (let step = 0; step < STEPS_PER_FRAME; step++) {
			this.updatePlayer(dt);
			this.updateProjectiles(dt);
		}

		this.renderer.render(this.scene, this.playerCamera);
		requestAnimationFrame(this.update.bind(this));
	}

	onWindowResize() {
		this.playerCamera.aspect = window.innerWidth / window.innerHeight;
		this.playerCamera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}
}

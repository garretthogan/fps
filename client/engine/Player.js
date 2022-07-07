import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { mapFloorHeights } from '../../utils/mapMetadata';
import { fireProjectile } from './projectilePool';

const RT = 3;
const LT = 2;

const FLOOR = 1;
const GRAVITY = 30;

export default class Player {
	constructor(scene, world, mapName) {
		this.world = world;

		document.body.addEventListener('keydown', (e) => this.onKeyDown(e.code));
		document.body.addEventListener('keyup', (e) => this.onKeyUp(e.code));
		document.body.addEventListener('mousemove', (e) => this.onMouseMove(e.movementX, e.movementY));

		this.keyCodes = {};
		this.rtUp = true;
		this.ltUp = true;

		const height = 1.5;
		this.root = new Object3D();
		this.cameraParent = new Object3D();
		this.isOnFloor = true;
		this.camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 1000);
		this.collider = new Capsule(
			new Vector3(0, mapFloorHeights[mapName], -2),
			new Vector3(0, mapFloorHeights[mapName] + height, -2),
			0.35
		);
		this.velocity = new Vector3();
		this.direction = new Vector3();
		this.cameraParent.add(this.camera);
		this.root.add(this.cameraParent);
		scene.add(this.root);
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
		this.rtUp = false;

		this.camera.getWorldDirection(this.direction);

		fireProjectile(this.collider.end, this.velocity, this.direction, this.collider.radius * 1.5);
	}
	onRightTriggerUp() {
		this.rtUp = true;
	}
	onLeftTriggerDown() {
		this.ltUp = false;
	}
	onLeftTriggerUp() {
		this.ltUp = true;
	}

	getForwardVector() {
		this.camera.getWorldDirection(this.direction);
		this.direction.y = 0;
		this.direction.normalize();

		return this.direction;
	}
	getSideVector() {
		this.camera.getWorldDirection(this.direction);
		this.direction.y = 0;
		this.direction.normalize();
		this.direction.cross(this.camera.up);

		return this.direction;
	}

	updateKeyboardInput(dt) {
		// keyboard input
		const speedDelta = dt * (this.isOnFloor ? 15 : 8);

		if (this.keyCodes['KeyW']) {
			this.velocity.add(this.getForwardVector().multiplyScalar(speedDelta));
		}

		if (this.keyCodes['KeyS']) {
			this.velocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
		}

		if (this.keyCodes['KeyA']) {
			this.velocity.add(this.getSideVector().multiplyScalar(-speedDelta));
		}

		if (this.keyCodes['KeyD']) {
			this.velocity.add(this.getSideVector().multiplyScalar(speedDelta));
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
			const speedDelta = dt * (this.isOnFloor ? 15 : 8);

			const lStick = [axes[0], axes[1]];
			const rStick = [axes[2], axes[3]];

			const lHorizontal = lStick[0];
			const lVertical = -1 * lStick[1];

			const lVertTrunc = lVertical < -0.2 || lVertical > 0.2 ? lVertical : 0;
			const lHorizontalTrunc = lHorizontal < -0.2 || lHorizontal > 0.2 ? lHorizontal : 0;

			this.velocity.add(this.getForwardVector().multiplyScalar(speedDelta * lVertTrunc));
			this.velocity.add(this.getSideVector().multiplyScalar(speedDelta * lHorizontalTrunc));

			const rHorizontal = rStick[0];
			const rVertical = rStick[1];

			const rVertTrunc = rVertical < -0.2 || rVertical > 0.2 ? rVertical : 0;
			const rHorizontalTrunc = rHorizontal < -0.2 || rHorizontal > 0.2 ? rHorizontal : 0;

			this.root.rotation.y -= (rHorizontalTrunc * 2) / 100;
			this.camera.rotation.x -= (rVertTrunc * 2) / 100;
		}
	}

	update(dt) {
		this.updateKeyboardInput(dt);
		this.updateGamepadInput(dt);

		// player movement
		let damping = Math.exp(-4 * dt) - 1;

		if (!this.isOnFloor) {
			this.velocity.y -= GRAVITY * dt;

			// small air resistance
			damping *= 0.1;
		}
		this.velocity.addScaledVector(this.velocity, damping);

		const deltaPosition = this.velocity.clone().multiplyScalar(dt);
		this.collider.translate(deltaPosition);

		this.root.position.copy(this.collider.end);

		// player collisions
		const result = this.world.worldOctree.capsuleIntersect(this.collider);

		this.isOnFloor = false;

		if (result) {
			this.isOnFloor = result.normal.y > 0;

			if (!this.isOnFloor) {
				this.velocity.addScaledVector(result.normal, -result.normal.dot(this.velocity));
			}

			this.collider.translate(result.normal.multiplyScalar(result.depth));
		}
	}
}

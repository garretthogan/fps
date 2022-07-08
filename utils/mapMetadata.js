/**
 * if you wanna add a map just add another *.glb file to the
 * /public/models directory and play add an entry to each of these,
 * using the file name as the key. the first one, mapFloorHeights determines how high
 * up the player spawns. the second, mapScales, determines how large we scale the map
 * when we load it in. you might have to play areound with these to get it to feel right
 */

const mapFloorHeights = {
	'collision-world': 2,
	'art-gallery': 1,
	'low-poly-playland': 30,
	'scifi-repair-dock': 30,
	'squid-game-map': 30,
	'a-liminal-space': 2,
	'fixed-mansion': 2,
};

const mapScales = {
	'collision-world': { x: 1, y: 1, Z: 1 },
	'art-gallery': { x: 0.01, y: 0.01, z: 0.01 },
	'low-poly-playland': { x: 0.45, y: 0.45, z: 0.45 },
	'scifi-repair-dock': { x: 0.2, y: 0.2, z: 0.2 },
	'squid-game-map': { x: 0.45, y: 0.45, z: 0.45 },
	'a-liminal-space': { x: 1.25, y: 1.5, z: 1.5 },
	'fixed-mansion': { x: 1, y: 1, z: 1 },
};

/**
 * the idea for this file is that it will eventually be abstracted to a database
 *
 * i wanna build an editor on top of the database that allows me to open the map
 * in a simple level editor and add things like lights and other assets. then, i
 * want to save all the assets that i added to the map's metadata that will live in
 * a server. then, when the map is loaded, it reads in the metadata for things like:
 * - player starting locations/team spawns
 * - treasure
 * - traps
 * - enemy spawns
 * - lights
 * - additional environment props
 *
 * so it would essentially be a game editor. maybe even with scripting and stuff
 * in the distant future. but i definitely need something to store and let me edit
 * this metadata so i can tailor it to things like specific game modes.
 */

module.exports = { mapFloorHeights, mapScales };

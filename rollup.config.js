import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
	input: 'src/game.js',
	output: {
		file: 'public/index.js',
		format: 'esm',
	},
	plugins: [nodeResolve(), commonjs()],
};

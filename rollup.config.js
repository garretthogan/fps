import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dotenv from 'rollup-plugin-dotenv';

export default {
	input: 'client/index.js',
	output: {
		file: 'public/index.js',
		format: 'esm',
	},
	plugins: [dotenv(), nodeResolve(), commonjs()],
};

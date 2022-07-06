const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);

const { start } = require('./net');

const WebSocket = require('ws');
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', start);
server.on('upgrade', (req, socket, head) => {
	wss.handleUpgrade(req, socket, head, function done(ws) {
		wss.emit('connection', ws, req);
	});
});

app.use(express.static('public'));
app.get('/:room', (req, res) => {
	const correctDirectory = __dirname.split('/');
	correctDirectory.pop();

	res.sendFile(correctDirectory.join('/') + '/public/index.html');
});

const port = process.env.NODE_ENV === 'prod' ? process.env.PORT : 3000;
server.listen(port, () => {
	console.log(`listening on *:${port}`);
});

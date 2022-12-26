const express = require('express');
const ws = require('ws');
const Mutex = require('async-mutex').Mutex;
const mutex = new Mutex();

const port = 8080;

const app = express();
const wsServer = new ws.Server({
    noServer: true
});
const moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
})
const validColors = {
    "red": "#FF0000",
    "green": "#00FF00",
    "blue": "#6666FF",
    "yellow": "#FFFF00",
    "purple": "#FF00FF",
    "teal": "#00FFFF",
    "orange": "#FF8000",
    "white": "#FDFDFD",
}

const messageTypes = {
    system: "system",
    reset: "reset",
    sendMoney: "sendMoney",
    addPlayer: "addPlayer",
    setColor: "setColor",
    toggleMillions: "toggleMillions"
}

const millionsMultiplyer = 10000;
var millions = false;

var state = {
    type: 'state',
    validColors: validColors,
    lastAction: '',
    wasReset: true,
    millions: millions,
    players: {},
    money: {},
    colors: {}
};

var clients = [];

function reset() {
    state.millions = millions;
    state.players = {};
    state.money = {};
    state.colors = {};
    state.wasReset = true;
}

wsServer.on('connection', socket => {
    socket.send(JSON.stringify({
        type: messageTypes.system,
        content: 'Acknowledge Connection'
    }));
    socket.send(JSON.stringify(state));
    clients.push(socket);
    socket.on('message', (event) => {
        mutex.runExclusive(() => {
            try {
                state.lastAction = '';
                state.wasReset = false;
                console.debug("Message Recieved:", event.toString());
                let data = JSON.parse(event.toString());
                if (data.type === messageTypes.reset) {
                    console.log("Resetting");
                    reset();
                } else if (data.type === messageTypes.toggleMillions) {
                    console.log("Toggling & Resetting");
                    millions = !millions;
                    reset();
                } else if (data.type === messageTypes.addPlayer) {
                    let id = data.player;
                    let newPlayer = data.content;
                    console.log("Adding player", newPlayer);
                    if (!state.money[id]) {
                        state.money[id] = 1500 * (millions ? millionsMultiplyer : 1);
                    }
                    state.players[id] = newPlayer;
                    state.lastAction = `${state.players[id]} was added to the game`;
                } else if (data.type === messageTypes.sendMoney) {
                    let id = data.player;
                    let update = data.content;
                    let target = update.target;
                    let amount = update.amount;
                    console.log("Sending money", update);
                    if (id === target) {
                        state.money[id] += amount;
                        state.lastAction = `${state.players[id]} gave themself ${moneyFormatter.format(amount)}`;
                    } else {
                        state.money[id] -= amount;
                        state.lastAction = `${state.players[id]} paid ${moneyFormatter.format(amount)}`;
                        if (target !== "bank") {
                            state.money[target] += amount;
                            state.lastAction += ` to ${state.players[target]}`
                        }
                    }
                } else if (data.type === messageTypes.setColor) {
                    let id = data.player;
                    let color = data.content;
                    console.log("Setting color", color)
                    if (!Object.values(state.colors).includes(color)) {
                        state.colors[id] = color;
                    }
                }
                broadcast(state);
            } catch (err) {
                console.error("Something went wrong", err)
            }
        })
    });
});

//Send a message to all clients
function broadcast(message) {
    let forRemoval = [];
    clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify(message))
        } else if (client.readyState === ws.CLOSED || client.readyState === ws.CLOSING) {
            forRemoval.push(client);
            console.log('Removing a client');
        }
    });
    clients = clients.filter(item => forRemoval.indexOf(item) === -1);
}

//Serve clients
app.use('/', express.static('Clients'));

//Start Server
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
})
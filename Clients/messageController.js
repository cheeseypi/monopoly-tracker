import {
    v4 as uuidv4
} from "https://jspm.dev/uuid";

function changeName() {
    let name = prompt("What's your name?");
    localStorage.setItem("name", name);
}

function changeColor() {
    let color = document.getElementById('color-select').value;
    console.log('color');
    x.send(JSON.stringify({
        type: 'setColor',
        player: localStorage.id,
        content: color
    }))
}

if (!localStorage.id) {
    // Do first time setup
    try {
        localStorage.setItem("id", uuidv4());
    }
    catch{
        localStorage.setItem("id", self.crypto.randomUUID());
    }
    changeName();
}

var x;
try {
    x = new WebSocket('wss://' + location.host);
} catch {
    x = new WebSocket('ws://' + location.host);
}
var state = {};
x.addEventListener('open', function (event) {
    console.log("Opened Socket");
});
x.addEventListener('message', function (event) {
    console.debug("Message Recieved:", event);
    let message = JSON.parse(event.data);
    if (message.type === 'state') {
        updateState(message);
    }
    if (message.type === 'system') {
        console.log("Recieved System Event: ", message.content)
    }
});

const moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
})

const playerNameElement = document.getElementById("playerName");

function updateState(newState) {
    let playerColor = newState.colors[localStorage.id];
    playerNameElement.innerText = localStorage.name;
    playerNameElement.style.borderColor = playerColor || '#ccc';

    let content = document.getElementById("content");
    content.innerHTML = "";
    if (!newState.players[localStorage.id]) {
        let joinButton = document.createElement('button');
        joinButton.innerText = "Join Game!";
        joinButton.onclick = joingame;

        content.appendChild(joinButton);
    } else {
        // Add player money
        let moneyVal = newState.money[localStorage.id];
        let money = document.createElement('h2');
        money.innerText = moneyFormatter.format(moneyVal);
        content.appendChild(money);
        // Add color picker
        let selection = document.createElement('select');
        selection.name = "color";
        selection.id = "color-select";

        let defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.disabled = true;
        if (!playerColor) {
            defaultOption.selected = true;
        }
        defaultOption.innerText = "-- Color --";
        selection.appendChild(defaultOption);

        let usedColors = Object.values(newState.colors);
        for (let colorName in newState.validColors) {
            let colorVal = newState.validColors[colorName];
            let colorOption = document.createElement('option');
            colorOption.value = colorVal;
            if (usedColors.includes(colorVal)) {
                colorOption.disabled = true;
            }
            if (playerColor === colorVal) {
                colorOption.selected = true;
            }
            colorOption.innerText = colorName.charAt(0).toUpperCase() + colorName.substring(1);
            selection.appendChild(colorOption);
        }

        selection.onchange = changeColor;

        content.appendChild(selection);
        content.appendChild(document.createElement('br'));
        // Add other player boxes
        for (let playerid in newState.players) {
            if (playerid != localStorage.id) {
                let playerBox = document.createElement('div');
                playerBox.className = "player";

                let playerName = document.createElement('p');
                playerName.innerText = newState.players[playerid];
                playerBox.appendChild(playerName);

                let playerValue = document.createElement('p');
                playerValue.innerText = moneyFormatter.format(newState.money[playerid]);
                playerBox.appendChild(playerValue);

                playerBox.style.backgroundColor = newState.colors[playerid] || '#ccc';
                content.appendChild(playerBox);
            }
        }
        // Add get/send money buttons
        content.appendChild(document.createElement('br'));

        let goButton = document.createElement('button');
        goButton.innerText = "Collect Go!";
        goButton.onclick = () => {
            sendMoney(localStorage.id, 200);
        };
        content.appendChild(goButton);

        content.appendChild(document.createElement('br'));

        let amount = document.createElement('input');
        amount.type = 'number';
        amount.id = 'amount';
        amount.placeholder = '$';
        amount.autofocus = true;
        content.appendChild(amount);

        content.appendChild(document.createElement('br'));

        let takeMoney = document.createElement('button');
        takeMoney.innerText = "Take";
        takeMoney.onclick = () => {
            sendMoney(localStorage.id, parseInt(amount.value));
        };
        content.appendChild(takeMoney);
        let payMoney = document.createElement('button');
        payMoney.innerText = "Pay to Bank";
        payMoney.onclick = () => {
            sendMoney('bank', parseInt(amount.value));
        };
        content.appendChild(payMoney);

        for (let playerid of Object.keys(newState.players)) {
            if (playerid != localStorage.id) {
                let payToPlayer = document.createElement('button');
                payToPlayer.innerText = "Send to " + newState.players[playerid];
                payToPlayer.onclick = () => {
                    sendMoney(playerid, parseInt(amount.value));
                };
                content.appendChild(payToPlayer);
            }
        }
    }

    let log = document.getElementById('activityLog');
    if (newState.lastAction) {
        let logItem = document.createElement('p');
        logItem.className = "logItem";
        logItem.innerText = newState.lastAction;
        log.prepend(logItem);
    }

    state = newState;
}

function sendMoney(target, amount) {
    x.send(JSON.stringify({
        type: "sendMoney",
        player: localStorage.id,
        content: {
            target,
            amount
        }
    }))
}

function joingame() {
    x.send(JSON.stringify({
        type: "addPlayer",
        player: localStorage.id,
        content: localStorage.name
    }));
}

function netChangeName() {
    changeName();
    x.send(JSON.stringify({
        type: "addPlayer",
        player: localStorage.id,
        content: localStorage.name
    }))
}

document.getElementById("changeName").onclick = netChangeName;
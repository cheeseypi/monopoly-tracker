import {
    v4 as uuidv4
} from "https://jspm.dev/uuid";

function changeName() {
    let name = prompt("What's your name?");
    localStorage.setItem("name", name);
}

if (!localStorage.id) {
    // Do first time setup
    localStorage.setItem("id", uuidv4());
    changeName();
}

var x = new WebSocket('ws://' + location.host);
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
    currency: 'USD'
})

function updateState(newState) {
    document.getElementById("playerName").innerText = localStorage.name;

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
        // Add other player boxes
        for (let playerid of Object.keys(newState.players)) {
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
        // Add color picker
        // Add get/send money buttons
        content.appendChild(document.createElement('br'));

        let goButton = document.createElement('button');
        goButton.innerText = "Go!";
        goButton.onclick = () => {
            sendMoney(localStorage.id, 200);
        };
        content.appendChild(goButton);

        content.appendChild(document.createElement('br'));

        let amount = document.createElement('input');
        amount.type = 'number';
        amount.id = 'amount';
        amount.placeholder = '$';
        amount.autofocus = 'autofocus';
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
                payToPlayer.innerText = "Send to "+newState.players[playerid];
                payToPlayer.onclick = () => {
                    sendMoney(playerid, parseInt(amount.value));
                };
                content.appendChild(payToPlayer);
            }
        }
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
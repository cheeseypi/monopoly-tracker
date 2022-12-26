var x;
try {
    x = new WebSocket('ws://' + location.host);
} catch {
    x = new WebSocket('wss://' + location.host);
}
var state = {};
x.addEventListener('open', function (event) {
    console.log("Opened Socket");
});

function resetGame() {
    x.send(JSON.stringify({
        type: "reset"
    }))
}
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

function resetGame() {
    x.send(JSON.stringify({
        type: "reset"
    }))
}
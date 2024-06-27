import skio from 'sveltekit-io'

export const card = (x) => `https://unpkg.com/cardsJS/dist/cards/${x}.svg`;
export const NUMBERS = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "K",
    "Q",
    "J",
    "A"
];
export const SUITS = ["S", "H", "D", "C"];
const ORDERS = { 'L': ['2', '3', '4', '5', '6', '7'], 'U': ['A', 'K', 'Q', 'J', '9', '10'] }
const socket = skio.get();

let players;
let turn = 1;
let cards_global = {};
let ids_global = []

socket.on("message", (msg) => {
    const { turn: newTurn, players: players_, moveCard } = msg;
    if (newTurn) turn = +newTurn;
    if (players) {
        players = players_
        setCards(msg.currentPlayer)
    }
    if (moveCard) document.getElementById("player-" + moveCard[1]).appendChild(cards_global[moveCard[0]]);
})

export function shuffle(cards, ids) {
    cards_global = cards
    ids_global = ids
    for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const container = document.getElementById("card-container");
    container.innerHTML = "";
    ids.forEach((id) => container.appendChild(cards[id]));
}

export function assignCards(currentPlayer) {
    players = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    for (let t = 1; t <= 6; t++) {
        players[t] = ids_global.slice((t - 1) * 9, t * 9);
    }
    socket.emit("message", { players, currentPlayer })
    return players;
}


export function setCards(player) {
    if (player) {
        players[player].forEach((id) =>
            document.getElementById("player-" + player).appendChild(cards_global[id]),
        );
        const container = document.getElementById("card-container");
        container.innerHTML = ""
    } else {
        for (let player in players) {
            players[player].forEach((id) =>
                document.getElementById("player-" + player).appendChild(cards_global[id]),
            );
        }
    }
}

export function call(player1, player2, id) {
    if (!players[player2].includes(id)) {
        turn = player2
        socket.emit("message", { turn: player2 })
    }

    players[player1].push(id);
    players[player2].splice(players[player2].indexOf(id), 1);
    socket.emit("message", { moveCard: [id, player1] })
}

export function dropPit(ids, player, pit, details) {
    const [order, suit] = pit.split('');
    const d = document.createElement('div')
    const pitObj = document.createElement('div')
    pitObj.classList.add('hand', 'hhand-compact')


    let winnerBool = [1, 3, 5].includes(+player);
    for (let n of ORDERS[order]) {
        if (!players[player].includes(n + suit)) {
            winnerBool = !winnerBool;
            break;
        }
    }

    let winner = winnerBool ? 'A' : 'B'
    d.innerHTML = `<b>${pit}</b></br>For player ${winner}`
    d.appendChild(pitObj)

    ORDERS[order].forEach((n) => {
        pitObj.appendChild(cards_global[n + suit])
    })

    document.getElementById('dropped').appendChild(d)
}
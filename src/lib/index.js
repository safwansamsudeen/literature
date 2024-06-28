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
const gameId = Math.floor(Math.random() * 100000)

let players;
let turn = 1;
let droppedPits = [];
let ids_global = [];

export function shuffle() {
    let ids = []
    for (let s of SUITS) for (let n of NUMBERS) ids.push(n + s)
    for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    ids_global = ids
    assignCards()
}

export function assignCards() {
    players = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    for (let t = 1; t <= 6; t++) {
        players[t] = ids_global.slice((t - 1) * 9, t * 9);
    }

    socket.emit("message", { players, turn, droppedPits, gameId })
    return players;
}


export function call(player1, player2, id) {
    if (!players[player2].includes(id)) {
        turn = player2
        socket.emit("message", { turn: player2 })
    } else {
        players[player1].push(id);
        players[player2].splice(players[player2].indexOf(id), 1);
        socket.emit("message", { players })
    }
}

export function dropPit(player, pit, details) {
    const [order, suit] = pit.split('');

    let pit_ids = []
    let flag = [1, 3, 5].includes(+player)
    let winnerBool = flag;
    for (let n of ORDERS[order]) {
        pit_ids.push(n + suit)
        if (winnerBool === flag && !players[player].includes(n + suit) && !players[details[n + suit]].includes(n + suit)) {
            winnerBool = !winnerBool;
        }
    }

    droppedPits.push({ pit, team: winnerBool ? 'A' : 'B', player, ids: pit_ids })
    for (let player in players) {
        players[player] = players[player].filter(id => !pit_ids.includes(id))
    }

    if (winnerBool !== flag) {
        alert('Pit Burn!')
    } else {
        alert('Yayy, a pit is dropped!')
    }

    socket.emit("message", { droppedPits, players, gameId })
}
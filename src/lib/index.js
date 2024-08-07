import skio from 'sveltekit-io'

export function card(x) {
    if (x.endsWith('J')) {
        return `/${x}.svg`
    }
    return `https://unpkg.com/cardsJS/dist/cards/${x}.svg`;
}
export const NUMBERS = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "T",
    "K",
    "Q",
    "J",
    "A"
];

import {createClient} from '@liveblocks/client';

const client = createClient({
    publicApiKey: "pk_prod_j3oFEW-4GGgVrZaRpOsj3os_9qN8FKrZ7zP49MefbqVtl6VXRKfeUFts6vQqqbH4",
});
export const { room, leave } = client.enterRoom("my-room");


export const SUITS = ["S", "H", "D", "C"];
export const ORDERS = { 'L': ['2', '3', '4', '5', '6', '7'], 'U': ['9', 'T', 'K', 'Q', 'J', 'A',], 'J': ['1J', '2J', '8S', '8C', '8H', '8D'] }
const gameId = Math.floor(Math.random() * 100000)

let players;
let turn = 1;
let moves = []
let droppedPits = [];
let ids_global = [];

export function shuffle() {
    let ids = ['1J', '2J']
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

    room.updatePresence({ players, turn, droppedPits, gameId, moves })
    return players;
}


export function call(player1, player2, id) {
    if (!players[player2].includes(id)) {
        turn = player2
        moves.push([player1, player2, id, 'L'])
        room.updatePresence({ turn: player2, moves })
    } else {
        players[player1].push(id);
        players[player2].splice(players[player2].indexOf(id), 1);
        moves.push([player1, player2, id, 'W'])
        room.updatePresence({ players, moves })
    }

}

export function dropPit(player, pit, details) {
    let [order, suit] = pit.split('');
    if (!suit) suit = '';

    let pit_ids = []
    let flag = [1, 3, 5].includes(+player)
    let winnerBool = flag;
    for (let n of ORDERS[order]) {
        pit_ids.push(n + suit)
        if (winnerBool === flag && !players[+player].includes(n + suit) && !players[details[n + suit]]?.includes?.(n + suit)) {
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

    room.updatePresence({ droppedPits, players, gameId })
}
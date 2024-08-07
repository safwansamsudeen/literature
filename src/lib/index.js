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

import {LiveObject, LiveMap} from "@liveblocks/client";
export const SUITS = ["S", "H", "D", "C"];
export const ORDERS = { 'L': ['2', '3', '4', '5', '6', '7'], 'U': ['9', 'T', 'K', 'Q', 'J', 'A',], 'J': ['1J', '2J', '8S', '8C', '8H', '8D'] }

let players;
let turn = 1;
let moves = []
let droppedPits = [];
let ids_global = [];


export function shuffle(room) {
    let ids = ['1J', '2J']
    for (let s of SUITS) for (let n of NUMBERS) ids.push(n + s)
    for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    ids_global = ids
    assignCards(room)
}

export async function assignCards(room) {
    players = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    for (let t = 1; t <= 6; t++) {
        players[t] = ids_global.slice((t - 1) * 9, t * 9);
    }
    const data = new LiveObject({ players, turn, droppedPits, moves });
    const game = new LiveMap();
    game.set("data", data);

    const { root } = await room.getStorage();
    root.set(game);

    room.broadcastEvent({ players, turn, droppedPits, moves })
    return players;
}


export function call(room, player1, player2, id) {
    room.broadcastEvent({ type: "REACTION", emoji: "🔥" });
    if (!players[player2].includes(id)) {
        turn = player2
        moves.push([player1, player2, id, 'L'])
        room.broadcastEvent({ turn: player2, moves })
    } else {
        players[player1].push(id);
        players[player2].splice(players[player2].indexOf(id), 1);
        moves.push([player1, player2, id, 'W'])
        room.broadcastEvent({ players, moves })
    }

}

export function dropPit(room, player, pit, details) {
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

    room.broadcastEvent({ droppedPits, players })
}
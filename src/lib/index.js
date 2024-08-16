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

export const SUITS = ["S", "H", "D", "C"];
export const ORDERS = { 'L': ['2', '3', '4', '5', '6', '7'], 'U': ['9', 'T', 'K', 'Q', 'J', 'A',], 'J': ['1J', '2J', '8S', '8C', '8H', '8D'] }

let players;
let turn = 2;
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

async function broadcast(room, obj)  {
    const { root } = await room.getStorage();
    console.log(obj)
    await root.update(obj)
    console.log(root.toObject())
}

export async function assignCards(room) {
    players = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    for (let t = 1; t <= 6; t++) {
        players[t] = ids_global.slice((t - 1) * 9, t * 9);
    }

    const { root } = await room.getStorage();
    root.update({ turn, droppedPits, moves });
    
    await broadcast(room, { players })
    return players;
}


export async function call(room, player1, player2, id) {
    console.log('calling', players, player2)
    if (!players[player2].includes(id)) {
        turn = player2
        moves.push([player1, player2, id, 'L'])
        await broadcast(room, { turn: player2, moves })
    } else {
        players[player1].push(id);
        players[player2].splice(players[player2].indexOf(id), 1);
        moves.push([player1, player2, id, 'W'])
        await broadcast(room, { players, moves })
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
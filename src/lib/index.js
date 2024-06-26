import { writable } from 'svelte/store';

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

let teams;
export const turn = writable(1);

export function shuffle(cards, ids) {
    for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const container = document.getElementById("card-container");
    container.innerHTML = "";
    ids.forEach((id) => container.appendChild(cards[id]));
    return true;
}

export function assignTeams(cards, ids) {
    teams = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    for (let t = 1; t <= 6; t++) {
        teams[t] = ids.slice((t - 1) * 9, t * 9);
    }

    for (let team in teams) {
        teams[team].forEach((id) =>
            document.getElementById("team-" + team).appendChild(cards[id]),
        );
    }
}

export function call(cards, team1, team2, id) {
    if (!teams[team2].includes(id)) turn.set(team2);

    teams[team1].push(id);
    teams[team2].splice(teams[team2].indexOf(id), 1);

    document.getElementById("team-" + team1).appendChild(cards[id]);
}
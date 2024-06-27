<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    import skio from "sveltekit-io";
    import {
        dropPit,
        call,
        card,
        shuffle,
        assignCards,
        SUITS,
        NUMBERS,
    } from "$lib/index";
    let turn = 1;
    let currentPlayer;
    let cards = {};
    let ids = [];
    let players = {};

    onMount(() => {
        currentPlayer = $page.url.searchParams.has("player")
            ? +$page.url.searchParams.get("player")
            : +prompt("Player");

        const container = document.getElementById("card-container");
        SUITS.forEach((suit) => {
            NUMBERS.forEach((n) => {
                let i = document.createElement("img");
                i.src = card(n + suit);
                i.classList.add("card");
                i.id = n + suit;
                cards[n + suit] = i;
                ids.push(n + suit);
                container.appendChild(i);
            });
        });

        shuffle(cards, ids);
        assignCards(currentPlayer);

        const socket = skio.get();
        socket.on("message", ({ newTurn, players: players_ }) => {
            if (newTurn) turn = +newTurn;
            if (players) players = players;
        });
    });
</script>

<div>
    <button on:click={() => call(turn, +prompt("Callee:"), prompt("Card:"))}
        >Call</button
    >
    <button
        on:click={() => {
            shuffle(cards, ids);
            assignCards();
        }}>Shuffle</button
    >
    <button on:click={() => dropPit(ids, turn, prompt("Pit:"), {})}
        >Drop pit</button
    >
</div>

<div id="card-container"></div>
{#each [1, 2, 3, 4, 5, 6] as i}
    {#if i === currentPlayer}
        <div class="player-block">
            <h2>Player {i}</h2>
            <div
                class="hand hhand-compact {turn == i ? 'active-hand' : ''}"
                id="player-{i}"
            ></div>
        </div>
    {:else}
        <div class="player-block">
            <div
                class="hand hhand-compact {turn == i ? 'active-hand' : ''}"
                id="player-{i}"
            >
                {players[i]?.length}
            </div>
        </div>
    {/if}
{/each}

<h1>Dropped Pits</h1>
<div id="dropped"></div>

<style>
    .hidden {
        display: none !important;
    }
    .player-block {
        width: 48%;
        display: inline-block;
    }

    .active-hand {
        border: 1px solid black;
        border-radius: 3px;
    }

    .hand {
        padding: 10px 40px;
    }
</style>

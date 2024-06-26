<script>
    import { onMount } from "svelte";
    import {
        dropPit,
        call,
        card,
        shuffle,
        assignTeams,
        SUITS,
        NUMBERS,
        turn,
    } from "$lib/index";
    // let turn = 1;

    let cards = {};
    let ids = [];

    onMount(() => {
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
        assignTeams(cards, ids);
    });
</script>

<div>
    <button
        on:click={() => call(cards, $turn, prompt("Callee:"), prompt("Card:"))}
        >Call</button
    >
    <button on:click={() => shuffle(cards, ids) && assignTeams(cards, ids)}
        >Shuffle</button
    >
    <button on:click={() => dropPit(cards, ids, $turn, prompt("Pit:"), {})}
        >Drop pit</button
    >
</div>

<div id="card-container"></div>
{#each [1, 2, 3, 4, 5, 6] as i}
    <div class="team-block">
        <h2>Team {i}</h2>
        <div
            class="hand hhand-compact {$turn == i ? 'active-hand' : ''}"
            id="team-{i}"
        ></div>
    </div>
{/each}

<h1>Dropped Pits</h1>
<div id="dropped"></div>

<style>
    .team-block {
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

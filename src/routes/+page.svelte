<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    import skio from "sveltekit-io";
    import { dropPit, call, card, shuffle } from "$lib/index";

    let turn = 1;
    let currentPlayer = 1;
    let droppedPits = [];
    let moves = [];
    let players = {};
    let gameId = 0;

    onMount(() => {
        currentPlayer = $page.url.searchParams.has("player")
            ? +$page.url.searchParams.get("player")
            : +prompt("Player");

        shuffle();

        const socket = skio.get();
        socket.on(
            "message",
            ({
                turn: newTurn,
                players: players_,
                droppedPits: droppedPits_,
                gameId: gameId_,
            }) => {
                if (newTurn) turn = +newTurn;
                if (players_?.[1]) players = players_;
                if (droppedPits_?.length) droppedPits = droppedPits_;
                if (gameId_) gameId = gameId_;
            },
        );
    });
</script>

<div>
    Game ID: {gameId}
    <button
        on:click={() =>
            call(turn, +prompt("Callee:"), prompt("Card:").toUpperCase())}
        disabled={turn !== currentPlayer}>Call</button
    >
    {#if moves.length === 0}
        <button on:click={shuffle}>Shuffle</button>
    {/if}
    <button
        on:click={() => {
            let details = {};
            let pit = prompt("Pit:");
            let p = +prompt("Number of cards held by teammates");
            for (let i = 0; i < p; i++) {
                details[prompt("Card")] = +prompt("Teammate");
            }
            dropPit(currentPlayer, pit, details);
        }}>Drop pit</button
    >
</div>

<div id="current-player-block">
    <h2>Your cards</h2>
    <div
        class="hand hhand-compact {turn == currentPlayer ? 'active-hand' : ''}"
        id="current-player-hand"
    >
        {#if players[currentPlayer]}
            {#each players[currentPlayer] as id}
                <img class="card" src={card(id)} alt={id} />
            {/each}
        {/if}
    </div>
</div>
<hr />
<div>
    {#each Object.keys(players) as t}
        {#if t != currentPlayer}
            <div class="player-block">
                Player {t}
                <div
                    class="hand hhand-compact {turn == t ? 'active-hand' : ''}"
                >
                    {players[t]?.length}
                </div>
            </div>
        {/if}
    {/each}
</div>

<h1>Dropped Pits</h1>
{#each droppedPits as p}
    <div>
        <p>
            {p.pit}
            <i>For team {p.team}</i>
        </p>
        <div class="hand hhand-compact">
            {#each p.ids as id}
                <img class="card" src={card(id)} alt={id} />
            {/each}
        </div>
    </div>
{/each}

<style>
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

    #current-player-hand {
        height: 200px;
    }

    #current-player-hand img {
        height: auto;
        width: auto;
        max-width: 100px;
    }
</style>

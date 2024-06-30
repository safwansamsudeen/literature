<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    import skio from "sveltekit-io";
    import { dropPit, call, card, shuffle, ORDERS } from "$lib/index";

    let turn = 1;
    let currentPlayer = 1;
    let droppedPits = [];
    let options = [];
    let moves = [];
    let players = {};
    let oppositePlayers = [];
    let callee;
    let gameId = 0;
    $: inplay = turn == currentPlayer;

    onMount(() => {
        currentPlayer = $page.url.searchParams.has("player")
            ? +$page.url.searchParams.get("player")
            : +prompt("Player");

        oppositePlayers = [1, 3, 5].includes(+currentPlayer)
            ? [2, 4, 6]
            : [1, 3, 5];
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
    function showOptions(e) {
        if (!inplay) return;
        let [number, suit] = e.target.alt;
        let pit_ids = [];
        for (let order in ORDERS) {
            if (ORDERS[order].includes(number)) {
                for (let n of ORDERS[order]) {
                    pit_ids.push(n + suit);
                }
            }
        }
        options = pit_ids.filter((id) => !players[currentPlayer].includes(id));
    }
</script>

<div>
    Game ID: {gameId}
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
    {#if inplay}
        <p><b>YOUR TURN</b></p>
    {/if}
    <div
        class="hand hhand-compact {inplay ? 'active-hand' : ''}"
        id="current-player-hand"
    >
        {#if players[currentPlayer]}
            {#each players[currentPlayer] as id}
                <img
                    class="card"
                    src={card(id)}
                    alt={id}
                    on:click={showOptions}
                />
            {/each}
        {/if}
    </div>
    {#if options.length}
        <h4>Call</h4>
        {#each oppositePlayers as number}
            <div>
                <input
                    type="radio"
                    id={number}
                    name="number"
                    value={number}
                    bind:group={callee}
                />
                <label for={number}>{number}</label>
            </div>
        {/each}
        <div class="hand active-hand" id="options">
            {#each options as id}
                <img
                    class="card option-image"
                    src={card(id)}
                    alt={id}
                    on:click={() => {
                        if (!callee) return;
                        call(turn, callee, id);
                        callee = null;
                        options = [];
                    }}
                />
            {/each}
        </div>
    {/if}
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

    .player-block .active-hand {
        border: 1px solid black;
        border-radius: 3px;
    }

    .hand {
        padding: 10px 40px;
    }

    #current-player-hand {
        height: 200px;
    }

    .option-image {
        margin: 0 10px;
    }

    #current-player-hand img {
        height: auto;
        width: auto;
        max-width: 100px;
    }
</style>

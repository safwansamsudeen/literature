<script>
    export let data;
    import { onDestroy, onMount } from "svelte";
    import { page } from "$app/stores";
    import { browser } from "$app/environment";

    import {
        dropPit,
        call,
        findPit,
        pretty,
        pretty_pit,
        card,
        ORDERS,
        setup,
        broadcast,
    } from "$lib/index";

    let turn, timeout, in_pit_drop;
    let currentPlayer = +$page.params.player;
    let droppedPits = [];
    let options = [];
    let moves = [];
    let active = [];
    let players = {};
    let oppositePlayers = [];
    let callee;
    let gameId = $page.params.gameid;
    let loading = true;

    let room = data.room;

    $: inplay = turn == currentPlayer;
    $: lastmove = moves[moves.length - 1] || [];

    room.connect();

    let unsubscribe;
    (async () => {
        const { root } = await room.getStorage();

        unsubscribe = room.subscribe(root, (root) => {
            const {
                turn: newTurn,
                players: players_,
                droppedPits: droppedPits_,
                moves: moves_,
                active: active_,
            } = root.toObject();

            if (newTurn) turn = +newTurn;
            if (players_?.[1].length) players = players_;
            if (droppedPits_?.length) droppedPits = droppedPits_;
            if (moves_) moves = moves_;
            if (active_) active = active_;
            if (browser && active.length >= 3) {
                loading = false;
            }
        });
    })();

    oppositePlayers = [1, 3, 5].includes(+currentPlayer)
        ? [2, 4, 6]
        : [1, 3, 5];

    async function destroy() {
        unsubscribe?.();
        try {
            const { root } = await room.getStorage();
            let obj = root.toObject();
            if (obj.active) {
                let data = {
                    active: [
                        ...obj.active.filter((id) => id !== currentPlayer),
                    ],
                };
                if (obj.active.length === 1) data.inprogress = false;
                await broadcast(room, data);
            }
        } finally {
            data.leave();
        }
    }

    onDestroy(destroy);

    if (browser) {
        setup(room, currentPlayer);
        window.onclose = destroy;
        window.onbeforeunload = destroy;
        if (active.length >= 3) {
            setTimeout(() => loading = false, 200);
        }
    }

    function showOptions(e) {
        if (!inplay) return;
        if (in_pit_drop) {
            let details = {};
            let p = +prompt("Number of cards held by teammates");
            if(!p) return
            for (let i = 0; i < p; i++) {
                let ans = prompt("Teammate")
                if(!ans) return
                details[prompt("Card")] = +ans;
            }
            if(confirm('Are you sure you want to drop this pit?')) dropPit(room, currentPlayer, findPit(e.target.alt), details);
        } else {
            let [number, suit] = e.target.alt;
        let pit_ids = [];

        let pit_order;
        for (let order in ORDERS) {
            if (ORDERS[order].includes(number + suit)) {
                for (let id of ORDERS[order]) {
                    pit_ids.push(id);
                    pit_order = order;
                }
                break;
            } else if (suit !== "J" && ORDERS[order].includes(number)) {
                for (let n of ORDERS[order]) {
                    pit_ids.push(n + suit);
                    pit_order = order;
                }
                break;
            }
        }

        options = pit_ids;
        }
        
    }

    function showDrop(e) {
        e.target.style.filter = "brightness(0.35)";

        var cardContainer = e.target.parentElement;
        var textOverlay = document.createElement('div');
        textOverlay.className = 'card-text'; 
        textOverlay.textContent = 'Drop Pit'; 
        
        cardContainer.appendChild(textOverlay);
        in_pit_drop = true
    }


    function getRandomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

  // Create a given number of sleet flakes
  function createSleet(numFlakes) {
    const sleetContainer = document.querySelector('#loading .sleet');
    for (let i = 0; i < numFlakes; i++) {
      const flake = document.createElement('div');
      flake.classList.add('flake');
      flake.style.left = `${getRandomInRange(0, 100)}%`;
      flake.style.animationDuration = `${getRandomInRange(2, 5)}s`;
      flake.style.animationDelay = `${getRandomInRange(0, 5)}s`;
      flake.style.transform = `scale(${getRandomInRange(0.5, 1)}`;
      sleetContainer.appendChild(flake);
    }
  }

  onMount(() => {
    createSleet(100); // Adjust the number of flakes as needed
  });
</script>

<svelte:head>
    <title>Player {currentPlayer} - Room {gameId}</title>
</svelte:head>
<div id="loading" style="{loading ? '' : 'display: none;'}">
    <h3 style="color: white; ">waiting for others...</h3>
    <div class="sleet">
    </div>
</div>

<div class="container-fluid {inplay ? 'active' : ''}" style="{inplay ? `background: ${data.background_color};` : ''} {loading ? `display: none;` : ''}">
    <div class="row">
        <div class="col-md-6">
            <div id="intro">
                <h5 class="text-muted w-20">
                    <small>
                        <p>Room ID: {gameId}</p>
                        <p>
                            {#if active.length > 1}
                                <em
                                    ><b>{active.length}</b> people are in this room.</em
                                >
                            {:else}
                                <em>You're the only one in the room.</em>
                            {/if}
                        </p>
                    </small>
                </h5>
            </div>
        </div>
        <div class="col-md-6 d-flex" id="players-panel">
            {#each Object.keys(players) as t}
                {#if t !== currentPlayer}
                    <div
                        class="player-block{turn == t
                            ? ' active'
                            : ''}{!active.includes(+t) ? ' striped' : ''}"
                    >
                        Player {t}: <b>{players[t]?.length}</b>
                    </div>
                {/if}
            {/each}
        </div>
    </div>
    {#if moves.length}
        <div
            class="alert alert-{lastmove[3] === 'W'
                ? 'success'
                : 'danger'} text-center w-75 mx-auto"
            role="alert"
        >
            <i>Last Move</i>: {lastmove[0] === currentPlayer
                ? "you"
                : "Player " + lastmove[0]} called {lastmove[1] === currentPlayer
                ? "you"
                : "Player " + lastmove[1]} for {pretty(lastmove[2])},
            <b>{lastmove[3] === "W" ? "successfully" : "and didn't get it"}</b>.
        </div>
    {/if}
    <div class="row">
        <h2 class="text-center col-md-8">Your Cards</h2>
        {#if options.length}
            <div class="col-md-4 text-center">
                <h4>Call</h4>
                {#each oppositePlayers as number}
                    <div class="form-check form-check-inline player-option">
                        <input
                            type="radio"
                            id={number}
                            name="number"
                            class="form-check-input"
                            value={number}
                            bind:group={callee}
                        />
                        <label for={number} class="form-check-label"
                            >Player {number}</label
                        >
                    </div>
                {/each}
            </div>
        {/if}
    </div>
    <div class="row">
        <div class="col-md-8 text-center">
            <div id="current-player-block">
                <div
                    class="hand hhand-compact d-flex justify-content-center flex-wrap {inplay
                        ? 'active-hand'
                        : ''}"
                    id="current-player-hand"
                >
                    {#if players[currentPlayer]}
                        {#each players[currentPlayer] as id}
                        <div class="card-container">
                            <img
                                class="lit-card m-1"
                                src={card(id)}
                                alt={id}
                                on:click={showOptions}
                                on:mouseenter={(e) =>
                                    (timeout = window.setTimeout(
                                        () => showDrop(e),
                                        1500,
                                    ))}
                                on:mouseleave={(e) => {
                                    clearTimeout(timeout);
                                    document
                                        .querySelector(".card-text")
                                        ?.remove?.();
                                    e.target.style.filter = "brightness(1)";
                                    in_pit_drop = false;
                                }}
                            />
                        </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
        <div class="col-md-4 text-center">
            {#if options.length}
                <div
                    class="hand active-hand d-flex justify-content-center flex-wrap"
                    id="options"
                >
                    {#each options as id}
                        <img
                            class="lit-card option-image m-1"
                            src={card(id)}
                            alt={id}
                            on:click={() => {
                                if (!callee) return;
                                call(room, turn, callee, id);
                                callee = null;
                                options = [];
                            }}
                        />
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    <h3 class="text-center">Dropped Pits</h3>
    <div class="row mt-3 mx-2" id="dropped-pits">
        {#each droppedPits as p}
            <div class="card my-2 col-md-4">
                <div class="card-body">
                    <p>
                        <em>{pretty_pit(p.pit)}</em>: for team {p.team}
                        <small> by Player {p.player}</small>
                    </p>
                    <div class="hand">
                        {#each p.ids as id}
                            <img class="lit-card" src={card(id)} alt={id} />
                        {/each}
                    </div>
                </div>
            </div>
        {:else}
            <p class="text-center col-md-12"><i>None dropped yet!</i></p>
        {/each}
    </div>
</div>

<style>
    .container-fluid {
        background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
        padding: 20px;
        min-height: 100vh;
        height: 100%;
    }

    .row {
        margin-bottom: 20px;
    }

    .striped {
        background: repeating-linear-gradient(
            -45deg,
            #a6cbfc,
            #a6cbfc 5px,
            white 5px,
            white 10px
        ) !important;
    }

    #current-player-block .hand {
        padding: 10px 0;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .hand img.lit-card {
        height: auto;
        width: auto;
        max-width: 150px;
        transition: transform 0.2s;
    }

    .hand img.lit-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(
            0,
            0,
            0,
            0.5
        ); 
        pointer-events: none; 
    }

    #dropped-pits .hand img.lit-card {
        max-width: 13%;
        margin: 5px;
    }

    .hand img.option-image:hover {
        transform: scale(1.05);
    }

    #players-panel {
        justify-content: space-between;
    }

    .player-block {
        height: min-content;
        border-radius: 20px;
        background: #fff;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        text-align: center;
        padding: 6px 12px;
        border: 1px solid black;
    }

    .player-block.active {
        background: #f46036;
        color: white;
    }

    .option-image {
        margin: 0 10px;
        transition: transform 0.2s;
    }

    .player-option {
        padding: 0px 10px;
    }

    #current-player-hand {
        height: auto;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 20px;
    }

    #options {
        margin-top: 20px;
    }

    h2,
    h5,
    p,
    label {
        color: #333;
    }

    #last-move-block,
    #dropped-pits {
        margin-top: 20px;
    }

    #last-move-block {
        padding: 10px;
        background: #ffc107;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    #loading {
        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background: #000; /* Dark background for contrast */
        display: flex;
        align-items: center;
        justify-content: center;
    }

  .sleet {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  :global(.flake) {
    position: absolute;
    width: 5px;
    height: 5px;
    background: white;
    opacity: 0.8;
    border-radius: 50%;
    animation: fall linear infinite;
  }

  @keyframes fall {
    0% {
      transform: translateY(-100vh);
    }
    100% {
      transform: translateY(100vh);
    }
  }

  :global(.card-text) {
      position: relative;
      bottom: 55%;
      color: white;
      font-size: 1rem; /* Adjust text size */
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7); /* Text shadow for better visibility */
      font-weight: bold;
      pointer-events: none; 
    }
</style>

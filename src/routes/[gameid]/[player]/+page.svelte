<script>
    export let data;
    import { onDestroy } from "svelte";
    import { page } from "$app/stores";
    import {browser} from '$app/environment'

    import { dropPit, call, findPit, pretty, card, ORDERS, setup, broadcast } from "$lib/index";
    
    let turn, timeout;
    let currentPlayer = +$page.params.player;
    let droppedPits = [];
    let options = [];
    let moves = [];
    let active = [];
    let players = {};
    let oppositePlayers = [];
    let callee;
    let gameId = $page.params.gameid;

    let room = data.room

    $: inplay = turn == currentPlayer;
    $: lastmove = moves[moves.length - 1] || [];

    room.connect();
    
    let unsubscribe;
    (async  () => {
        const { root } = await room.getStorage();

        unsubscribe = room.subscribe(root, (root) => {
            const {
                turn: newTurn,
                players: players_,
                droppedPits: droppedPits_,
                moves: moves_,
                active: active_,
            } = root.toObject()

            if (newTurn) turn = +newTurn;
            if (players_?.[1].length) players = players_;
            if (droppedPits_?.length) droppedPits = droppedPits_;
            if (moves_) moves = moves_;
            if (active_) active = active_
        });
    })()

    oppositePlayers = [1, 3, 5].includes(+currentPlayer)
        ? [2, 4, 6]
        : [1, 3, 5];

    
    async function destroy() {
        unsubscribe?.()
        try {
            const {root} = await room.getStorage();
            let obj = root.toObject()
            if (obj.active) {
                let data = { active: [...obj.active.filter(id => id !== currentPlayer)] }
                if (obj.active.length === 1) data.inprogress = false
                await broadcast(room, data)
            }
        } finally {
            data.leave()
        }
        
    }

    onDestroy(destroy)

    if (browser) {
        setup(room, currentPlayer)
        window.onclose = destroy
        window.onbeforeunload = destroy
    }

    function showOptions(e) {
        if (!inplay) return;
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

    function showDrop(e) {
        e.target.style.filter = 'brightness(0.35)';
        let {top, height, left, width} = e.target.getBoundingClientRect()

        let textOverlay = document.createElement('div');
        textOverlay.textContent = 'Drop Pit'; 
        
        textOverlay.style.position = 'fixed';
        textOverlay.style.top = top + height / 2 - 12 + 'px';
        textOverlay.style.left = left + width / 2 - 31 + 'px';
        // textOverlay.style.transform = 'translate(-50%, -50%)';
        textOverlay.style.color = 'white';
        textOverlay.style.fontSize = '1rem'; 
        textOverlay.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.7)'; 
        textOverlay.style.fontWeight = 'bold';
        textOverlay.classList.add('drop-pit-banner')
        textOverlay.onclick = () => {
            let details = {};
                    let pit = findPit(e.target.alt);
                    let p = +prompt("Number of cards held by teammates");
                    for (let i = 0; i < p; i++) {
                        details[prompt("Card")] = +prompt("Teammate");
                    }
                    dropPit(room, currentPlayer, pit, details);
                }
        // Append the text overlay to the body
        document.body.appendChild(textOverlay);
    }
</script>
<svelte:head>
    <title>Room {gameId} - Player {currentPlayer}</title> 
</svelte:head>

<div class="container-fluid {inplay ? 'active' : ''}">
    <div class="row">
        <div class="col-md-6">
            <div id="intro">
                <h5 class="text-muted w-20">
                    <small>
                        <p>Room ID: {gameId}</p>
                        <p>
                            {#if active.length > 1}
                                <em><b>{active.length}</b> people are in this room.</em>
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
                    <div class="player-block{turn == t ? ' active' : ''}{!active.includes(+t) ? ' striped' : ''}">
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
                            <img
                                class="lit-card m-1"
                                src={card(id)}
                                alt={id}
                                on:click={showOptions}
                                on:mouseenter={e => timeout = window.setTimeout(() => showDrop(e), 1500)}
                                on:mouseleave={e => {
                                    clearTimeout(timeout); 
                                    document.querySelector('.drop-pit-banner')?.remove?.()
                                    e.target.style.filter = 'brightness(1)'
                                }}
                            />
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
                                callee = null
                                options = [];
                            }}
                        />
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    <h3 class="text-center">Dropped Pits</h3>
    <div class="row mt-3" id="dropped-pits">
        {#each droppedPits as p}
            <div class="card my-2 col-md-6">
                <div class="card-body">
                    <p>
                        {p.pit}:
                        <i>For team {p.team}</i>
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

    .container-fluid.active {
        background: linear-gradient(135deg, #99e1d9, #70abaf);
    }

    .row {
        margin-bottom: 20px;
    }

    .striped {
        background: repeating-linear-gradient(-45deg, #a6cbfc, #a6cbfc 5px, white 5px, white 10px) !important;
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
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5); /* Adjust the opacity for the shadow effect */
      pointer-events: none; /* Ensures the overlay does not interfere with clicking on the card */
    }

    #dropped-pits .hand img.lit-card {
        max-width: 14%;
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
</style>

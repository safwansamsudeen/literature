import { createClient } from "@liveblocks/client";
import { browser } from "$app/environment";

import WebSocket from "ws";

function getRandomHexColor() {
  const hex = Math.floor(Math.random() * 16777215).toString(16);
  return `#${hex.padStart(6, "0")}`;
}

export function load({ params, fetch }) {
  const client = createClient({
    polyfills: {
      fetch,
      WebSocket: browser ? window.WebSocket : WebSocket,
    },
    authEndpoint: async (room) => {
      const headers = {
        "Content-Type": "application/json",
      };

      const body = JSON.stringify({
        player: params.player,
        room,
      });

      const response = await fetch("/api/liveblocks-auth", {
        method: "POST",
        headers,
        body,
      });

      return await response.json();
    },
  });

  const { room, leave } = client.enterRoom("game-" + params.gameid);
  return {
    room,
    leave,
    background_color: `linear-gradient(135deg, ${getRandomHexColor()}, ${getRandomHexColor()})`,
  };
}

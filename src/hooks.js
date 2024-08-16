import skio from "sveltekit-io";
import { browser } from "$app/environment";

skio
  .setup("http://localhost:3001", {
    cors: {
      origin: "*",
      credentials: true,
    },
  })
  .then((io) => {
    if (browser) return;
    io.on("connect", (socket) => {
      socket.on("message", (message) => {
        if (message.game_stop === true) {
          socket.disconnect();
        } else {
          socket.emit("message", message);
          socket.broadcast.emit("message", message);
        }
      });
    });
  });

export const handle = async ({ event, resolve }) => {
  if (!browser)
    skio
      .get()
      ?.emit("message", { message: `New request: ${event.request.url}` });
  return await resolve(event);
};

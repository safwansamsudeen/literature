import {createClient} from '@liveblocks/client';


export function load({ params }) {
	const client = createClient({
        publicApiKey: "pk_prod_j3oFEW-4GGgVrZaRpOsj3os_9qN8FKrZ7zP49MefbqVtl6VXRKfeUFts6vQqqbH4",
    });
    const { room } = client.enterRoom("game" + params.gameid);
    return {room}
}
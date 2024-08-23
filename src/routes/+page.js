import { redirect } from "@sveltejs/kit"

export function load({url}) {
    let room = url.searchParams.get('room')
    if(room) {
        let player = 1;
        return redirect(300, `/${room}/${player}`)
    }
}
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: "sk_prod_ItFDQGhRS_9hw2wSP53aQAw5Kri0Om_XmTXcz80dqkWPI7dIbZh1m3QNHPk9rTaP",
});

export async function POST({ request }) {
  const {player} = await request.json()
  // Start an auth session inside your endpoint
  const session = liveblocks.prepareSession('' + player, {userInfo: {hey: 'world'}});


  // Use a naming pattern to allow access to rooms with wildcards
  // Giving the user read access on their org, and write access on their group
  session.allow(`game-*`, session.FULL_ACCESS);

  // Authorize the user and return the result
  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
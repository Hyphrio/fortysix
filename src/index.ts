import { Router, Application } from "@oak/oak";
import { random45 } from "./random";
import { AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { calculateDifference } from "./utils";
import { Kysely } from "kysely";
import { DB } from "./db/types";
import { D1Dialect } from "kysely-d1";
import { TwitchCache } from "./twitchcache";
import { WorkersKVCache } from "./cache";

const router = new Router();

router.get("/", (ctx) => {
	ctx.response.body = "Hello 45!"
})

router.get("/_/45", async function FortyFiveHandler(ctx) {
	const searchParams = ctx.request.url.searchParams;
	const user = searchParams.get("user");
	const fortyFive = random45();
	const timestamp = Date.now();

	if (user) {
		const twitch: TwitchCache = ctx.state.cache.twitch;
		const helix = await twitch.getUserByName(user);

		if (helix) {
			const kysely: Kysely<DB> = ctx.state.kysely.database;

			if (fortyFive != 45) {
				await kysely.insertInto('Attempts')
					.values({
						value: fortyFive,
						helixId: helix.id,
						difference: calculateDifference(fortyFive),
						timestamp,
					})
					.executeTakeFirst();

				ctx.response.body = `${helix.displayName}, ${fortyFive.toFixed(3)}`
			} else {
				await kysely.deleteFrom('Attempts').execute()
				ctx.response.body = `${helix.displayName} achieved perfect 45!`
			}
		}

	} else {
		ctx.response.body = fortyFive.toFixed(3)
	}

})

router.get("/_/best45", async function bestFortyFiveHandler(ctx) {
	const kysely: Kysely<DB> = ctx.state.kysely.database;
	const result = await kysely.selectFrom('Attempts')
		.select((eb) =>
			eb.fn.min('Attempts.difference').as('difference')
		)
		.select([
			'Attempts.helixId', 'Attempts.value'
		])
		.executeTakeFirst();

	if (result) {
		const twurple: ApiClient = ctx.state.cache.twitch.makeClient();
		const user = await twurple.users.getUserById(result.helixId);

		if (user) {
			ctx.response.body = `${user.displayName}, ${result.value.toFixed(3)}`
		}
	} else {
		ctx.response.body = "Nobody have done a 45 yet."
	}
})

router.get("/_/pb45", async function personalBestFortyFiveHandler(ctx) {
	const searchParams = ctx.request.url.searchParams;
	const user = searchParams.get("user");

	if (user) {
		const twitch: TwitchCache = ctx.state.cache.twitch;
		const helix = await twitch.getUserByName(user);

		if (helix) {
			const kysely: Kysely<DB> = ctx.state.kysely.database;
			const result = await kysely.selectFrom('Attempts')
				.select((eb) =>
					eb.fn.min('Attempts.difference').as('difference')
				)
				.where('Attempts.helixId', '=', helix.id)
				.select('Attempts.value')
				.executeTakeFirst();

			if (result) {
				ctx.response.body = `${helix.displayName}, ${result.value.toFixed(3)}`
			} else {
				ctx.response.body = `${user} did not do a 45 yet.`
			}

		}
	} else {
		ctx.response.body = "No user passed."
	}
})

interface WorkerState extends Env {
	kysely: {
		database: Kysely<DB>
	},
	cache: {
		twitch: TwitchCache
	},
}

export default {
	async fetch(req, env, ctx): Promise<Response> {
		// Kysely
		const database = new Kysely<DB>({ dialect: new D1Dialect({ database: env.DB }) })

		const twitch = new TwitchCache(new WorkersKVCache(env.helix_cache), {
			clientId: env.TWITCH_CLIENT_ID,
			clientSecret: env.TWITCH_CLIENT_SECRET
		});

		const state: WorkerState = {
			kysely: {
				database
			},
			cache: {
				twitch
			},
			...env
		};

		// Oak
		const app = new Application({ state, contextState: "alias" });

		// Add the routes
		app.use(router.routes())
		app.use(router.allowedMethods())

		// Export to Workers
		return app.fetch(req, env as unknown as Record<string, string>, ctx)
	}
} satisfies ExportedHandler<Env>

import { Router, Application } from "@oak/oak";
import { random45 } from "./random";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { calculateDifference } from "./utils";

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
		const twurple: ApiClient = ctx.state.twurple.client;
		const helix = await twurple.users.getUserByName(user);

		if (helix) {
			const prisma: PrismaClient = ctx.state.prisma.client;

			if (fortyFive != 45) {
				await prisma.attempts.create({
					data: {
						helixId: helix.id,
						timestamp,
						difference: calculateDifference(fortyFive),
						value: fortyFive
					}
				});

				ctx.response.body = `${helix.displayName}, ${fortyFive.toFixed(3)}`
			} else {
				await prisma.attempts.deleteMany({})
				ctx.response.body = `${helix.displayName} achieved perfect 45!`
			}
		}

	} else {
		ctx.response.body = fortyFive.toFixed(3)
	}

})

router.get("/_/best45", async function bestFortyFiveHandler(ctx) {
	const prisma: PrismaClient = ctx.state.prisma.client;
	const result = await prisma.attempts.findFirst({
		orderBy: {
			difference: "asc"
		}
	});

	if (result) {
		const twurple: ApiClient = ctx.state.twurple.client;
		const user = await twurple.users.getUserById(result.helixId);

		if (user) {
			ctx.response.body = `${user.displayName}, ${result.value}`
		}
	} else {
		ctx.response.body = "Nobody have done a 45 yet."
	}
})

router.get("/_/pb45", async function personalBestFortyFiveHandler(ctx) {
	const searchParams = ctx.request.url.searchParams;
	const user = searchParams.get("user");

	if (user) {
		const twurple: ApiClient = ctx.state.twurple.client;
		const helix = await twurple.users.getUserByName(user);

		if (helix) {
			const prisma: PrismaClient = ctx.state.prisma.client;
			const result = await prisma.attempts.findFirst({
				where: {
					helixId: helix.id
				},
				orderBy: {
					difference: "asc"
				}
			});

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

interface WorkerState {
	prisma: {
		adapter: PrismaD1,
		client: PrismaClient
	},
	twurple: {
		authProvider: AppTokenAuthProvider,
		client: ApiClient
	}
}

export default {
	async fetch(req, env, ctx): Promise<Response> {
		// Prisma
		const adapter = new PrismaD1(env.DB);
		const prisma = new PrismaClient({ adapter });

		// Twurple
		const authProvider = new AppTokenAuthProvider(
			env.TWITCH_CLIENT_ID,
			env.TWITCH_CLIENT_SECRET
		);
		const twurple = new ApiClient({
			authProvider
		});

		const state: WorkerState = {
			prisma: {
				adapter,
				client: prisma,
			},
			twurple: {
				authProvider,
				client: twurple
			}
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

import { ApiClient } from "@twurple/api";
import { UniversalCache } from "./cache";
import { AppTokenAuthProvider } from "@twurple/auth";

class TwitchCache {
    private cacher: UniversalCache<TwitchCachify>;
    private authTokens: {
        clientId: string,
        clientSecret: string
    };
    private apiClient?: ApiClient;

    constructor(cache: UniversalCache<TwitchCachify>, authTokens: {
        clientId: string,
        clientSecret: string
    }) {
        this.cacher = cache
        this.authTokens = authTokens
    }

    async getUserByName(username: string): Promise<TwitchCachify | undefined> {
        const key = ["twitch", username.toLowerCase()];
        const cache = await this.cacher.get(key);

        console.log(cache)

        if (cache) {
            return cache
        }

        const apiCall = await this.makeClient().users.getUserByName(username);

        if (apiCall) {
            const data = {
                id: apiCall.id,
                displayName: apiCall.displayName
            };

            await this.cacher.insert(key, data, { expiresIn })

            return data
        }

        return;
    }

    makeClient(): ApiClient {
        if (this.apiClient) {
            return this.apiClient
        }

        return new ApiClient({ authProvider: new AppTokenAuthProvider(this.authTokens.clientId, this.authTokens.clientSecret, []) })
    }
}

const expiresIn = 21_600;

type TwitchCachify = {
    id: string,
    displayName: string
}

export {
    type TwitchCachify,
    TwitchCache
}
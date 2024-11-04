import { ApiClient } from "@twurple/api";
import { UniversalCache } from "./cache";

class TwitchCache {
    private cacher: UniversalCache<TwitchCachify>;
    private apiClient: ApiClient;

    constructor(cache: UniversalCache<TwitchCachify>, api: ApiClient) {
        this.cacher = cache
        this.apiClient = api
    }

    async getUserByName(username: string): Promise<TwitchCachify | undefined> {
        const key = ["twitch", username.toLowerCase()];
        const cache = await this.cacher.get(key);

        console.log(cache)

        if (cache) {
            return cache
        }

        const apiCall = await this.apiClient.users.getUserByName(username);

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
}

const expiresIn = 1_800_000;

type TwitchCachify = {
    id: string,
    displayName: string
}

export {
    type TwitchCachify,
    TwitchCache
}
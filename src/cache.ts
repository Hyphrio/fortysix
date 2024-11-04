import { KVNamespace } from "@cloudflare/workers-types";

interface UniversalCache<T> {
    insert(key: string[], value: T, opts?: UniversalCacheOptions): Promise<void>;
    get(key: string[]): Promise<T | null | undefined>;
    delete(key: string[]): Promise<void>;
}

type UniversalCacheOptions = {
    expiresIn?: number
}

class WorkersKVCache<T> implements UniversalCache<T> {
    private kv: KVNamespace
    constructor(kv: KVNamespace) {
        this.kv = kv;
    }

    async insert(key: string[], value: T, opts?: UniversalCacheOptions): Promise<void> {
        const k = key.join(',');
        const v = JSON.stringify(value);

        if (opts) {
            await this.kv.put(k, v, { expirationTtl: opts.expiresIn })
        } else {
            await this.kv.put(k, v)
        }

        return;
    }
    async get(key: string[]): Promise<T | null | undefined> {
        const k = key.join(',');

        return this.kv.get(k, "json");
    }
    async delete(key: string[]): Promise<void> {
        const k = key.join(',');

        return this.kv.delete(k)
    }

}

export {
    type UniversalCache,
    type UniversalCacheOptions,
    WorkersKVCache
}
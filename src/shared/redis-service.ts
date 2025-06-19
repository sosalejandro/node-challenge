import { createClient, RedisClientType } from 'redis';

export interface IRedisService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, expireSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
}

export class RedisService implements IRedisService {
    private client: RedisClientType;

    constructor(url: string) {
        this.client = createClient({ url });
        this.client.connect();
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.client.get(key);
        return data ? (JSON.parse(data) as T) : null;
    }

    async set<T>(key: string, value: T, expireSeconds?: number): Promise<void> {
        const data = JSON.stringify(value);
        if (expireSeconds) {
            await this.client.set(key, data, { EX: expireSeconds });
        } else {
            await this.client.set(key, data);
        }
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }
}

// Example key helpers for different object types
export const redisKeys = {
    user: (id: string) => `user:${id}`,
    product: (id: string) => `product:${id}`,
    order: (id: string) => `order:${id}`,
};

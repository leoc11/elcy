import { Defer } from "../Common/Defer";
import { IPoolOption } from "./IPoolOption";
import { PoolResource } from "./PoolResource";

export abstract class Pool<T extends PoolResource> {
    public get poolSize() {
        return this.pool.length;
    }
    public get waitCount() {
        return this.waitingQueues.length;
    }
    public get activeResourceCount() {
        return this.resourceCount;
    }
    constructor(public readonly option: IPoolOption) {
        this.option.max = this.option.max || 10;
        this.option.min = this.option.min || 0;
        if (this.option.min > this.option.max) {
            this.option.min = this.option.max;
        }
        this.option.maxResource = this.option.maxResource || this.option.max * 1.5;
        this.option.queueType = this.option.queueType || "fifo";
        this.option.idleTimeout = this.option.idleTimeout || 30_000;
        this.option.acquireTimeout = this.option.acquireTimeout || 60_000;
        this.getIdleResource = this.option.queueType === "lifo" ? () => this.pool.pop() : () => this.pool.shift();
    }
    public readonly waitingQueues: Array<[Defer<T>, any]> = [];
    public readonly pool: Array<[T, any]> = [];
    private resourceCount = 0;
    private getIdleResource: () => [T, any];
    public async acquireResource(): Promise<T> {
        let resource: T = null;
        if (this.pool.length > 0) {
            const r = this.getIdleResource();
            if (r[1] !== null) {
                clearTimeout(r[1]);
            }
            resource = r[0];
        }

        if (!resource && this.resourceCount < this.option.maxResource) {
            resource = await this.createNewResource();
        }

        if (resource) {
            this.createIdleResources();
            return resource;
        }

        const waitDefer = new Defer<T>();
        const waitQueue: [Defer<T>, any] = [waitDefer, null];
        this.waitingQueues.push(waitQueue);
        if (this.option.acquireTimeout !== Infinity && this.option.acquireTimeout >= 0) {
            waitQueue[1] = setTimeout(() => {
                waitDefer.reject(new Error("Acquire Timeout"));
            }, this.option.acquireTimeout);
        }
        return waitDefer;
    }
    public abstract create(): Promise<T>;
    protected async createNewResource() {
        const resource = await this.create();
        this.resourceCount++;
        resource.releaseEvent.add(() => {
            this.addToPool(resource);
        });

        return resource;
    }
    protected async createIdleResources() {
        while (this.option.min > this.pool.length && this.resourceCount < this.option.maxResource) {
            const res = await this.createNewResource();
            if (!res) {
                break;
            }
            this.addToPool(res);
        }
    }
    protected addToPool(resource: T) {
        if (this.pool.length >= this.option.max) {
            this.resourceCount--;
            resource.destroy();
            return;
        }

        if (this.waitingQueues.length > 0 && this.pool.length === 0) {
            const waitQ = this.waitingQueues.shift();
            if (waitQ[1] !== null) clearTimeout(waitQ[1]);
            waitQ[0].resolve(resource);
            return;
        }

        let to = null;
        if (this.option.idleTimeout !== Infinity) {
            to = setTimeout(() => {
                // idle resources must be the oldest one
                if (this.pool[0] === idleQueue) {
                    this.pool.shift();
                }
                else {
                    this.pool.delete(idleQueue);
                }

                this.resourceCount--;
                resource.destroy();
            }, this.option.idleTimeout);
        }
        const idleQueue: [T, any] = [resource, to];
        this.pool.push(idleQueue);
    }
}

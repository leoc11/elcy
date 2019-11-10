import { Defer } from "../Common/Defer";
import { IPoolOption } from "./IPoolOption";
import { PoolResource } from "./PoolResource";

export abstract class Pool<T extends PoolResource> {
    public get poolSize() {
        return this.idleQueues.length;
    }
    public get waitCount() {
        return this.waitingQueues.length;
    }
    public get activeResourceCount() {
        return this.resourceCount;
    }
    constructor(public readonly option: IPoolOption) {
        this.option.min = this.option.min || 0;
        this.option.max = this.option.max || 10;
        this.option.maxResource = this.option.maxResource || this.option.max || Infinity;
        this.option.queueType = this.option.queueType || "fifo";
        this.getIdleResourse = this.option.queueType === "lifo" ? () => this.idleQueues.pop() : () => this.idleQueues.shift();
        this.option.idleTimeout = this.option.idleTimeout || 30_000;
        this.option.acquireTimeout = this.option.acquireTimeout || 60_000;
    }
    public readonly waitingQueues: Array<[Defer<T>, any]> = [];
    public readonly idleQueues: Array<[T, any]> = [];
    private resourceCount = 0;
    private getIdleResourse: () => [T, any];
    public async acquireResource(): Promise<T> {
        if (this.idleQueues.length > 0) {
            const r = this.getIdleResourse();
            if (r[1] !== null) {
                clearTimeout(r[1]);
            }
            return r[0];
        }

        if (this.resourceCount < this.option.maxResource) {
            const resource = await this.create();
            this.resourceCount++;
            resource.releaseEvent.add(() => {
                if (this.waitingQueues.length > 0) {
                    const waitQ = this.waitingQueues.pop();
                    if (waitQ[1] !== null) clearTimeout(waitQ[1]);
                    waitQ[0].resolve(resource);
                    return;
                }

                if (this.idleQueues.length > this.option.max) {
                    this.resourceCount--;
                    resource.destroy();
                    return;
                }

                const idleQueue: [T, any] = [resource, null];
                this.idleQueues.push(idleQueue);
                this.setIdleTimeout(idleQueue);
            });
            return resource;
        }

        const waitDefer = new Defer<T>();
        const waitQueue: [Defer<T>, any] = [waitDefer, null];
        this.waitingQueues.push(waitQueue);
        if (this.option.acquireTimeout !== Infinity) {
            waitQueue[1] = setTimeout(() => waitDefer.reject(new Error("Acquire Timeout")), this.option.acquireTimeout);
        }
        return waitDefer;
    }
    public abstract create(): Promise<T>;
    private setIdleTimeout(queue: [T, any]) {
        if (this.option.idleTimeout !== Infinity) {
            queue[1] = setTimeout(() => {
                // idle resources must be the oldest one
                if (this.idleQueues[0] === queue) {
                    this.idleQueues.shift();
                }
                else {
                    this.idleQueues.delete(queue);
                }

                if (this.idleQueues.length > this.option.min) {
                    this.resourceCount--;
                    queue[0].destroy();
                }
                else {
                    this.idleQueues.push(queue);
                    this.setIdleTimeout(queue);
                }
            }, this.option.idleTimeout);
        }
    }
}

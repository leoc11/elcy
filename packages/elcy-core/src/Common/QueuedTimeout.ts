import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { SortedArray } from "./SortedArray";

interface IQueuedTimeoutItem<T = unknown> {
    item: T;
    timeOut: number;
}

export class QueuedTimeout<T> {
    constructor(public readonly action: (item: T) => Promise<unknown>) { }
    public readonly queue = SortedArray.create((a: IQueuedTimeoutItem<T>, b: IQueuedTimeoutItem<T>) => {
        return a.timeOut < b.timeOut ? -1 : a.timeOut > b.timeOut ? 1 : 0;
    });
    private _timeout: NodeJS.Timeout | string | number | undefined;
    public clearTimeout(item?: T) {
        if (this._timeout && this.queue.length > 0) {
            if (item) {
                const timeoutItem = this.queue[0];
                if (timeoutItem.item !== item) {
                    const existing = this.queue.find((o) => o.item === item);
                    if (existing) {
                        ArrayExtension.delete(this.queue, existing);
                    }
                    return;
                }
            }

            clearTimeout(this._timeout);
            this._timeout = null;
            if (this.queue.length > 0) {
                this.setTimeout();
            }
        }
    }
    public async forceExecute(count: number) {
        if (count < 0) {
            count = 0;
        }
        const items = this.queue.splice(0, count);
        this.clearTimeout();
        for (const item of items) {
            await this.action(item.item);
        }
    }
    public pop() {
        const item = this.queue.pop();
        if (this.queue.length === 0) {
            this.clearTimeout();
        }
        return item ? item.item : undefined;
    }
    public async reset(): Promise<void> {
        const queue = this.queue.splice(0);
        this.clearTimeout();
        for (const item of queue) {
            await this.action(item.item);
        }
    }
    public setTimeout(): void;
    public setTimeout(item: T, timeOut?: Date): void;
    public setTimeout(item?: T, timeOut?: Date) {
        let timeoutItem: IQueuedTimeoutItem<T>;
        if (item) {
            if (!this.queue.some((o) => o.item === item)) {
                timeoutItem = { item: item, timeOut: timeOut ? timeOut.getTime() : Infinity };
                this.queue.push(timeoutItem);
            }
        }
        else {
            timeoutItem = this.queue[0];
        }

        if (!this._timeout && timeoutItem && timeoutItem.timeOut !== Infinity) {
            this._timeout = setTimeout(() => this.execute(), Date.now() - timeoutItem.timeOut);
        }
    }
    public shift() {
        const item = this.queue.shift();
        this.clearTimeout();
        return item ? item.item : undefined;
    }
    private async execute() {
        const item = this.queue.shift();
        this._timeout = null;
        if (item) {
            await this.action(item.item);
        }

        if (this.queue.length) {
            this.setTimeout();
        }
    }
}

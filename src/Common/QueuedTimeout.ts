import { SortedArray } from "./SortedArray";

interface IQueuedTimeoutItem<T = any> {
    item: T;
    timeOut: number;
}

export class QueuedTimeout<T> {
    constructor(public readonly action: (item: T) => any) { }
    public readonly queue = SortedArray.create((a: IQueuedTimeoutItem<T>, b: IQueuedTimeoutItem<T>) => {
        return a.timeOut < b.timeOut ? -1 : a.timeOut > b.timeOut ? 1 : 0;
    });
    private _timeout: any;
    public setTimeout(): void;
    public setTimeout(item: T, timeOut?: Date): void;
    public setTimeout(item?: T, timeOut?: Date) {
        let timeoutItem: IQueuedTimeoutItem<T>;
        if (item) {
            if (!this.queue.any(o => o.item === item)) {
                timeoutItem = { item: item, timeOut: timeOut ? timeOut.getTime() : Infinity };
                this.queue.push(timeoutItem);
            }
        }
        else {
            timeoutItem = this.queue[0];
        }

        if (!this._timeout && timeoutItem && timeoutItem.timeOut !== Infinity) {
            this._timeout = setTimeout(() => {
                const item = this.queue.shift();
                this._timeout = null;
                if (item)
                    this.action(item.item);

                if (this.queue.length)
                    this.setTimeout();
            }, Date.now() - timeoutItem.timeOut);
        }
    }
    public clearTimeout(item?: T) {
        if (this._timeout && this.queue.length > 0) {
            if (item) {
                const timeoutItem = this.queue[0];
                if (timeoutItem.item !== item) {
                    const existing = this.queue.where(o => o.item === item).first();
                    if (existing) {
                        this.queue.remove(existing);
                    }
                    return;
                }
            }

            clearTimeout(this._timeout);
            this._timeout = null;
            if (this.queue.length > 0)
                this.setTimeout();
        }
    }
    public reset(): void {
        const queue = this.queue.splice(0);
        this.clearTimeout();
        for (const item of queue) {
            this.action(item.item);
        }
    }
    public pop() {
        const item = this.queue.pop();
        if (this.queue.length === 0)
            this.clearTimeout();
        return item ? item.item : undefined;
    }
    public shift() {
        const item = this.queue.shift();
        this.clearTimeout();
        return item ? item.item : undefined;
    }
    public forceTimeoutFirst(count: number) {
        if (count < 0)
            count = 0;
        const items = this.queue.splice(0, count);
        this.clearTimeout();
        for (const item of items)
            this.action(item.item);
    }
}
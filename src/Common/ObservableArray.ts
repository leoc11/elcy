export type ArrayChangeType = "add" | "del";
export class ObservableArray<T> extends Array<T> {
    // TODO: NOT WORKING
    // public set length(value: number) {
    //     this.splice(value);
    // }
    public constructor(...items: T[]) {
        super(...items);
    }
    public static observe<T>(items: T[]): ObservableArray<T> {
        Object.setPrototypeOf(items, ObservableArray.prototype);
        const observable = items as ObservableArray<T>;
        observable._observers = [];
        return observable;
    }
    private _observers: Array<(eventType: ArrayChangeType, items: T[]) => void> = [];
    public pop() {
        const hasAny = this.length > 0;
        const result = super.pop();
        if (hasAny) {
            this.raiseEvents("del", [result]);
        }
        return result;
    }
    public push(...items: T[]) {
        const result = super.push(...items);
        if (items.length > 0) {
            this.raiseEvents("add", items);
        }
        return result;
    }
    public register(observer: (eventType: ArrayChangeType, items: T[]) => void) {
        this._observers.push(observer);
    }
    public shift() {
        const hasAny = this.length > 0;
        const result = super.shift();
        if (hasAny) {
            this.raiseEvents("del", [result]);
        }
        return result;
    }
    public splice(start: number, deleteCount?: number, ...items: T[]) {
        const result = super.splice(start, deleteCount, ...items);
        if (result.length > 0) {
            this.raiseEvents("del", result);
        }
        if (items.length > 0) {
            this.raiseEvents("add", items);
        }
        return result;
    }
    public unobserve() {
        this._observers = [];
    }
    public unshift(...items: T[]) {
        const result = super.unshift(...items);
        if (items.length > 0) {
            this.raiseEvents("add", items);
        }
        return result;
    }
    protected raiseEvents(eventType: ArrayChangeType, items: T[]) {
        for (const observer of this._observers) {
            observer(eventType, items);
        }
    }
}

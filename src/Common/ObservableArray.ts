export type ArrayChangeType = "add" | "del";
export class ObservableArray<T> extends Array<T> {
    private _observers: Array<(eventType: ArrayChangeType, items: T[]) => void> = [];
    public constructor(...items: T[]) {
        super(...items);
        // Object.setPrototypeOf(this, ObservableArray.prototype);
    }
    static from<T>(items: T[]): ObservableArray<T> {
        return new ObservableArray(...items);
    }
    static observe<T>(items: T[]): ObservableArray<T> {
        Object.setPrototypeOf(items, ObservableArray.prototype);
        const observable = items as ObservableArray<T>;
        observable._observers = [];
        return observable;
    }
    public register(observer: (eventType: ArrayChangeType, items: T[]) => void) {
        this._observers.push(observer);
    }
    public unobserve() {
        this._observers = [];
    }
    protected raiseEvents(eventType: ArrayChangeType, items: T[]) {
        for (const observer of this._observers) {
            observer(eventType, items);
        }
    }
    public push(...items: T[]) {
        const result = super.push(...items);
        if (items && items.length > 0)
            this.raiseEvents("add", items);
        return result;
    }
    public pop() {
        const result = super.pop();
        if (result)
            this.raiseEvents("del", [result]);
        return result;
    }
    public shift() {
        const result = super.shift();
        if (result)
            this.raiseEvents("del", [result]);
        return result;
    }
    public unshift(...items: T[]) {
        const result = super.unshift();
        if (items && items.length > 0)
            this.raiseEvents("add", items);
        return result;
    }
    public splice(start: number, deleteCount?: number, ...items: T[]) {
        const result = super.splice(start, deleteCount, ...items);
        if (result.length > 0)
            this.raiseEvents("del", result);
        if (items && items.length > 0)
            this.raiseEvents("add", items);
        return result;
    }
    public set length(value: number) {
        this.splice(value);
    }
}
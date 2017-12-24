export class ClassEventListener<TThis, TInput, TResult> {
    // tslint:disable-next-line:variable-name
    private _eventHandlers: Array<(this: TThis, input?: TInput) => TResult>;
    constructor(public stopOnFalse = false) {

    }
    public add(event: (this: TThis, input?: TInput) => TResult) {
        if (event.name)
            this.remove(event.name);

        this._eventHandlers.add(event);
    }
    public remove(event: string | ((this: TThis, input?: TInput) => TResult)) {
        const removeEvents = this._eventHandlers.where((ev) => typeof event === "string" ? ev.name === event : ev === event);
        this._eventHandlers.remove.apply(this._eventHandlers, removeEvents);
    }
    public trigger(thisParam: TThis, input?: TInput): TResult[] | Error {
        const result: TResult[] = [];
        for (const ev of this._eventHandlers) {
            const curRes = ev.apply(thisParam, [input]);
            if (curRes instanceof Error)
                return curRes;
            result.push(curRes);
            if (this.stopOnFalse && curRes === false)
                break;
        }
        return result;
    }
}

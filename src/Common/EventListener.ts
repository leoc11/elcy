import { hashCode } from "../Helper/Util";

export class EventListener<TInput = any, TEntity = any, TFunc extends (this: TEntity, params: TInput) => boolean | void = any> {
    private _eventHandlers: Map<number, TFunc> = new Map();
    constructor(protected readonly self: TEntity, public stopOnFalse = false) {
    }
    public add(event: TFunc, id?: number) {
        if (typeof id !== "number")
            id = event.name ? hashCode(event.name) : hashCode(event.toString());

        this._eventHandlers.set(id, event);
        return id;
    }
    public remove(id: number | TFunc) {
        if (typeof id !== "number")
            id = id.name ? hashCode(id.name) : hashCode(id.toString());

        return this._eventHandlers.delete(id);
    }
    public emit(params: TInput): boolean {
        let result: boolean = true;
        for (const [, ev] of this._eventHandlers) {
            try {
                const curRes = ev.apply(this.self, [params]);
                if (typeof curRes === "boolean")
                    result = result && curRes;
                if (this.stopOnFalse && curRes === false)
                    break;
            }
            catch (e) {
                return result;
            }
        }
        return result;
    }
}

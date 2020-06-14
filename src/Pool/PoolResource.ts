import { EventHandlerFactory } from "../Event/EventHandlerFactory";
import { IEventDispacher, IEventHandler } from "../Event/IEventHandler";

export abstract class PoolResource {
    constructor() {
        [this.releaseEvent, this.onReleased] = EventHandlerFactory<void, void>(null);
    }
    public releaseEvent: IEventHandler<void, void>;
    protected onReleased: IEventDispacher<void>;
    public abstract destroy(): void;
}

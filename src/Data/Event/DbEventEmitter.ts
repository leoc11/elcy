import { IDBEventListener } from "./IDBEventListener";
import { ISaveEventParam } from "../../MetaData/Interface/ISaveEventParam";
import { IDeleteEventParam } from "../../MetaData/Interface/IDeleteEventParam";

export class DBEventEmitter<T> {
    public eventListeners: IDBEventListener<T>[];
    constructor(...eventListeners: IDBEventListener<T>[]) {
        this.eventListeners = eventListeners;
    }
    public emitBeforeSaveEvent(entity: T, param: ISaveEventParam) {
        for (const eventl of this.eventListeners) {
            if (eventl.beforeSave)
                eventl.beforeSave(entity, param);
        }
    }
    public emitBeforeDeleteEvent(entity: T, param: IDeleteEventParam) {
        for (const eventl of this.eventListeners) {
            if (eventl.beforeDelete)
                eventl.beforeDelete(entity, param);
        }
    }
    public emitAfterLoadEvent(entity: T) {
        for (const eventl of this.eventListeners) {
            if (eventl.afterLoad)
                eventl.afterLoad(entity);
        }
    }
    public emitAfterSaveEvent(entity: T, param: ISaveEventParam) {
        for (const eventl of this.eventListeners) {
            if (eventl.afterSave)
                eventl.afterSave(entity, param);
        }
    }
    public emitAfterDeleteEvent(entity: T, param: IDeleteEventParam) {
        for (const eventl of this.eventListeners) {
            if (eventl.afterDelete)
                eventl.afterDelete(entity, param);
        }
    }
}

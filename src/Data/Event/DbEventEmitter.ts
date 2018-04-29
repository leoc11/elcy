import { IDBEventListener } from "./IDBEventListener";
import { ISaveEventParam, IDeleteEventParam } from "../../MetaData/Interface";

export class DBEventEmitter<T> {
    public eventListeners: IDBEventListener<T>[];
    constructor(...eventListeners: IDBEventListener<T>[]) {
        this.eventListeners = eventListeners;
    }
    public emitBeforeSaveEvent(entity: T, param: ISaveEventParam) {
        for (const eventl of this.eventListeners) {
            eventl.beforeSave(entity, param);
        }
    }
    public emitBeforeDeleteEvent(entity: T, param: IDeleteEventParam) {
        for (const eventl of this.eventListeners) {
            eventl.beforeDelete(entity, param);
        }
    }
    public emitAfterLoadEvent(entity: T) {
        for (const eventl of this.eventListeners) {
            eventl.afterLoad(entity);
        }
    }
    public emitAfterSaveEvent(entity: T, param: ISaveEventParam) {
        for (const eventl of this.eventListeners) {
            eventl.afterSave(entity, param);
        }
    }
    public emitAfterDeleteEvent(entity: T, param: IDeleteEventParam) {
        for (const eventl of this.eventListeners) {
            eventl.afterDelete(entity, param);
        }
    }
}

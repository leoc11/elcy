import { IDBEventListener } from "./IDBEventListener";
import { ISaveEventParam } from "../../MetaData/Interface/ISaveEventParam";
import { IDeleteEventParam } from "../../MetaData/Interface/IDeleteEventParam";
import { EntityEntry } from "../EntityEntry";

export class DBEventEmitter<T = any> {
    public eventListeners: IDBEventListener<T>[];
    constructor(...eventListeners: IDBEventListener<T>[]) {
        this.eventListeners = eventListeners;
    }
    public emitBeforeSaveEvent(param: ISaveEventParam, ...entries: Array<EntityEntry<T>>) {
        const beforeSaves: Array<(entity: T, param: ISaveEventParam) => void> = [];
        for (const eventl of this.eventListeners) {
            if (eventl.beforeSave)
                beforeSaves.push(eventl.beforeSave);
        }
        if (beforeSaves.length > 0) {
            for (const entry of entries) {
                for (const handler of beforeSaves) {
                    handler(entry.entity, param);
    }
            }
        }
    }
    public emitBeforeDeleteEvent(param: IDeleteEventParam, ...entries: Array<EntityEntry<T>>) {
        const beforeDeletes: Array<(entity: T, param: IDeleteEventParam) => void> = [];
        for (const eventl of this.eventListeners) {
            if (eventl.beforeDelete)
                beforeDeletes.push(eventl.beforeDelete);
        }
        if (beforeDeletes.length > 0) {
            for (const entry of entries) {
                for (const handler of beforeDeletes) {
                    handler(entry.entity, param);
    }
            }
        }
    }
    public emitAfterLoadEvent(...entries: Array<EntityEntry<T>>) {
        const afterLoads: Array<(entity: T) => void> = [];
        for (const eventl of this.eventListeners) {
            if (eventl.afterLoad)
                afterLoads.push(eventl.afterLoad);
        }
        if (afterLoads.length > 0) {
            for (const entry of entries) {
                for (const handler of afterLoads) {
                    handler(entry.entity);
    }
            }
        }
    }
    public emitAfterSaveEvent(param: ISaveEventParam, ...entries: Array<EntityEntry<T>>) {
        const afterSaves: Array<(entity: T, param: ISaveEventParam) => void> = [];
        for (const eventl of this.eventListeners) {
            if (eventl.afterSave)
                afterSaves.push(eventl.afterSave);
        }
        if (afterSaves.length > 0) {
            for (const entry of entries) {
                for (const handler of afterSaves) {
                    handler(entry.entity, param);
                }
            }
        }
    }
    public emitAfterDeleteEvent(param: IDeleteEventParam, ...entries: Array<EntityEntry<T>>) {
        const afterDeletes: Array<(entity: T, param: IDeleteEventParam) => void> = [];
        for (const eventl of this.eventListeners) {
            if (eventl.afterDelete)
                afterDeletes.push(eventl.afterDelete);
        }
        if (afterDeletes.length > 0) {
            for (const entry of entries) {
                for (const handler of afterDeletes) {
                    handler(entry.entity, param);
                }
            }
        }
    }
}

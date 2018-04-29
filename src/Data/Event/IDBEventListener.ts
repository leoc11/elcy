import { ISaveEventParam, IDeleteEventParam } from "../../MetaData/Interface";

export interface IDBEventListener<T> {
    beforeSave?: (entity: T, param: ISaveEventParam) => boolean;
    beforeDelete?: (entity: T, param: IDeleteEventParam) => boolean;
    afterLoad?: (entity: T) => void;
    afterSave?: (entity: T, param: ISaveEventParam) => void;
    afterDelete?: (entity: T, param: IDeleteEventParam) => void;
}
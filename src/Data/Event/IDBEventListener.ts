import { IDeleteEventParam } from "../../MetaData/Interface/IDeleteEventParam";
import { ISaveEventParam } from "../../MetaData/Interface/ISaveEventParam";

export interface IDBEventListener<T = any> {
    afterDelete?: (entity: T, param: IDeleteEventParam) => void;
    afterLoad?: (entity: T) => void;
    afterSave?: (entity: T, param: ISaveEventParam) => void;
    beforeDelete?: (entity: T, param: IDeleteEventParam) => boolean;
    beforeSave?: (entity: T, param: ISaveEventParam) => boolean;
}

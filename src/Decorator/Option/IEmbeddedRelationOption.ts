import { IObjectType } from "../../Common/Type";

export interface IEmbeddedRelationOption<TS = any, TT = any> {
    nullable?: boolean;
    prefix?: string;
    propertyName?: keyof TS;
    sourceType?: IObjectType<TS>;
    targetType?: IObjectType<TT>;
}

import { IObjectType } from "../../Common/Type";

export interface IEmbeddedRelationOption<TS = any, TT = any> {
    sourceType?: IObjectType<TS>;
    targetType?: IObjectType<TT>;
    propertyName?: keyof TS;
    prefix?: string;
    nullable?: boolean;
}

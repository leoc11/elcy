import { IObjectType, ReferenceOption } from "../../Common/Type";

export interface IRelationOption<TSource, TTarget> {
    sourceType?: IObjectType<TSource>;
    targetType: IObjectType<TTarget>;
    metaType?: IObjectType;
    relationKeys?: Array<keyof TSource | ((source: TSource) => any)>;
    name?: string;
    isMaster: boolean;
    updateOption?: ReferenceOption;
    deleteOption?: ReferenceOption;
    relationType: "one" | "many";
    manyToManyMapName: string;
    propertyName?: keyof TSource;
}

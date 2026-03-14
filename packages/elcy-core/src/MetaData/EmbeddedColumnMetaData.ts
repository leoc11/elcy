import { RelationshipType } from "../Common/StringType";
import { IEmbeddedRelationOption } from "../Decorator/Option/IEmbeddedRelationOption";
import { IBaseRelationMetaData } from "./Interface/IBaseRelationMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { getEntityMetadata } from "./MetaDataMapper";

export class EmbeddedRelationMetaData<TS extends object= object, TT extends object= object> implements IBaseRelationMetaData<TS, TT> {
    public get relationType(): RelationshipType {
        return "one";
    }
    constructor(option: IEmbeddedRelationOption<TS, TT>) {
        this.propertyName = option.propertyName;
        this.source = getEntityMetadata(option.sourceType);
        this.target = getEntityMetadata(option.targetType);
        this.prefix = option.prefix;
        this.nullable = option.nullable;
    }
    public nullable?: boolean;
    public prefix?: string;
    public propertyName: keyof TS;
    public source: IEntityMetaData<TS>;
    public target: IEntityMetaData<TT>;
}

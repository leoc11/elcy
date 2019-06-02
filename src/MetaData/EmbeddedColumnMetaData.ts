import { RelationshipType } from "../Common/StringType";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IEmbeddedRelationOption } from "../Decorator/Option/IEmbeddedRelationOption";
import { IBaseRelationMetaData } from "./Interface/IBaseRelationMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class EmbeddedRelationMetaData<TS = any, TT = any> implements IBaseRelationMetaData<TS, TT> {
    public get relationType(): RelationshipType {
        return "one";
    }
    constructor(option: IEmbeddedRelationOption<TS, TT>) {
        this.propertyName = option.propertyName;
        this.source = Reflect.getOwnMetadata(entityMetaKey, option.sourceType);
        this.target = Reflect.getOwnMetadata(entityMetaKey, option.targetType);
        this.prefix = option.prefix;
        this.nullable = option.nullable;
    }
    public nullable?: boolean;
    public prefix?: string;
    public propertyName: keyof TS;
    public source: IEntityMetaData<TS>;
    public target: IEntityMetaData<TT>;
}

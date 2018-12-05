import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { IBaseRelationMetaData } from "./Interface/IBaseRelationMetaData";
import { IEmbeddedRelationOption } from "../Decorator/Option/IEmbeddedRelationOption";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { RelationshipType } from "../Common/Type";

export class EmbeddedRelationMetaData<TS = any, TT = any> implements IBaseRelationMetaData<TS, TT> {
    public propertyName: keyof TS;
    public prefix?: string;
    public source: IEntityMetaData<TS>;
    public target: IEntityMetaData<TT>;
    public nullable?: boolean;
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
}

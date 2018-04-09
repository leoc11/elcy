import { IObjectType, RelationType } from "../../Common/Type";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { EntityMetaData } from "../EntityMetaData";
import { IRelationMetaData } from "../Interface";
import { ForeignKeyMetaData } from "./ForeignKeyMetaData";

export class SlaveRelationMetaData<TSlave, TMaster> implements IRelationMetaData<TSlave, TMaster> {
    public _targetType: IObjectType<TMaster>;
    public _relationMaps: Map<keyof TSlave, keyof TMaster>;
    public get targetType(): IObjectType<TMaster> {
        if (!this._targetType) {
            const entityMetaData: EntityMetaData<TSlave> = Reflect.getOwnMetadata(entityMetaKey, this.sourceType);
            const foreignKey: ForeignKeyMetaData<TSlave, TMaster> = entityMetaData.foreignKeys[this.foreignKeyName];
            this._targetType = foreignKey.masterType;
        }

        return this._targetType;
    }
    public get relationMaps() {
        if (!this._relationMaps) {
            const entityMetaData: EntityMetaData<TSlave> = Reflect.getOwnMetadata(entityMetaKey, this.sourceType);
            const foreignKey: ForeignKeyMetaData<TSlave, TMaster> = entityMetaData.foreignKeys[this.foreignKeyName];
            this._relationMaps = foreignKey.relationMaps;
        }
        return this._relationMaps;
    }
    constructor(public sourceType: IObjectType<TSlave>, public foreignKeyName: string, public relationType = RelationType.OneToOne, public reverseProperty?: string) {

    }
}

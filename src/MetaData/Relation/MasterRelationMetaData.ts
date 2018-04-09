import { IObjectType, RelationType } from "../../Common/Type";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { EntityMetaData } from "../EntityMetaData";
import { IRelationMetaData } from "../Interface/IRelationMetaData";
import { ForeignKeyMetaData } from "./ForeignKeyMetaData";

export class MasterRelationMetaData<TMaster, TSlave> implements IRelationMetaData<TMaster, TSlave> {
    private _relationMaps: Map<keyof TMaster, keyof TSlave>;
    public get relationMaps() {
        if (!this._relationMaps) {
            this._relationMaps = new Map();
            const entityMetaData: EntityMetaData<TSlave> = Reflect.getOwnMetadata(entityMetaKey, this.sourceType);
            const foreignKey: ForeignKeyMetaData<TSlave, TMaster> = entityMetaData.foreignKeys[this.foreignKeyName];
            Object.keys(foreignKey.relationMaps).forEach((o: keyof TSlave) => {
                const masterProp = foreignKey.relationMaps[o];
                if (typeof masterProp !== "undefined")
                    this._relationMaps.set(masterProp, o);
            });
        }
        return this._relationMaps;
    }
    constructor(public sourceType: IObjectType<TMaster>, public targetType: IObjectType<TSlave>, public foreignKeyName: string, public relationType = RelationType.OneToMany, public reverseProperty?: string) {
    
    }
}

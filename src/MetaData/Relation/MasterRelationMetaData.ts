import { IObjectType, RelationType } from "../../Common/Type";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { EntityMetaData } from "../EntityMetaData";
import { IRelationMetaData } from "../Interface/IRelationMetaData";
import { ForeignKeyMetaData } from "./ForeignKeyMetaData";

export class MasterRelationMetaData<TMaster, TSlave> implements IRelationMetaData<TSlave, TMaster> {
    private _relationMaps: {[key in keyof TMaster]?: keyof TSlave; };
    public get relationMaps(): {[key in keyof TMaster]?: keyof TSlave } {
        if (!this._relationMaps) {
            this._relationMaps = {};
            const entityMetaData: EntityMetaData<TSlave> = Reflect.getOwnMetadata(entityMetaKey, this.slaveType);
            const foreignKey: ForeignKeyMetaData<TSlave, TMaster> = entityMetaData.foreignKeys[this.foreignKeyName];
            Object.keys(foreignKey.relationMaps).forEach((o: keyof TSlave) => {
                const masterProp = foreignKey.relationMaps[o];
                if (typeof masterProp !== "undefined")
                    (this._relationMaps as any)[masterProp] = o;
            });
        }
        return this._relationMaps;
    }
    constructor(public slaveType: IObjectType<TSlave>, public masterType: IObjectType<TMaster>, public foreignKeyName: string, public relationType = RelationType.OneToMany, public reverseProperty?: string) {
    
    }
}

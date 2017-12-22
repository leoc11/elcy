import { entityMetaKey } from "../Decorators/DecoratorKey";
import { EntityMetaData } from "./EntityMetaData";
import { ForeignKeyMetaData } from "./ForeignKeyMetaData";
import { IRelationMetaData } from "./Interface/IRelationMetaData";
import { genericType, RelationType } from "./Types";

export class MasterRelationMetaData<TMaster, TSlave> implements IRelationMetaData<TSlave, TMaster> {

    // tslint:disable-next-line:variable-name
    private _relationMaps: {[key in keyof TMaster]?: keyof TSlave } = {};
    public get relationMaps(): {[key in keyof TMaster]?: keyof TSlave } {
        if (!this._relationMaps) {
            const entityMetaData: EntityMetaData<TSlave> = Reflect.getOwnMetadata(entityMetaKey, this.slaveType);
            const foreignKey: ForeignKeyMetaData<TSlave, TMaster> = entityMetaData.foreignKeys[this.foreignKeyName];
            Object.keys(foreignKey.relationMaps).forEach((o: keyof TSlave) => this._relationMaps[foreignKey.relationMaps[o]] = o);
        }
        return this._relationMaps;
    }
    constructor(public slaveType: genericType<TSlave>, public masterType: genericType<TMaster>, public foreignKeyName: string, public relationType = RelationType.OneToMany) {

    }
}

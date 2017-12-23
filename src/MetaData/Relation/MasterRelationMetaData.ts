import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { EntityMetaData } from "../EntityMetaData";
import { IRelationMetaData } from "../Interface/IRelationMetaData";
import { genericType, RelationType } from "../Types";
import { ForeignKeyMetaData } from "./ForeignKeyMetaData";

export class MasterRelationMetaData<TMaster, TSlave> implements IRelationMetaData<TSlave, TMaster> {

    // tslint:disable-next-line:variable-name
    private _relationMaps: {[key in keyof TMaster]?: keyof TSlave } = {};
    public get relationMaps(): {[key in keyof TMaster]?: keyof TSlave } {
        if (!this._relationMaps) {
            const entityMetaData: EntityMetaData<TSlave> = Reflect.getOwnMetadata(entityMetaKey, this.slaveType);
            const foreignKey: ForeignKeyMetaData<TSlave, TMaster> = entityMetaData.foreignKeys[this.foreignKeyName];
            Object.keys(foreignKey.relationMaps).forEach((o: keyof TSlave) => {
                const masterProp = foreignKey.relationMaps[o];
                if (typeof masterProp !== "undefined")
                    this._relationMaps[masterProp] = o;
            });
        }
        return this._relationMaps;
    }
    constructor(public slaveType: genericType<TSlave>, public masterType: genericType<TMaster>, public foreignKeyName: string, public relationType = RelationType.OneToMany) {

    }
}

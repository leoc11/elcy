import { IObjectType, RelationType } from "../../Common/Type";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { EntityMetaData } from "../EntityMetaData";
import { IRelationMetaData } from "../Interface";
import { ForeignKeyMetaData } from "./ForeignKeyMetaData";

export class SlaveRelationMetaData<TSlave, TMaster> implements IRelationMetaData<TSlave, TMaster> {
    // tslint:disable-next-line:variable-name
    public _masterType: IObjectType<TMaster>;
    // tslint:disable-next-line:variable-name
    public _relationMaps: {[key in keyof TSlave]?: keyof TMaster };
    public get masterType(): IObjectType<TMaster> {
        if (!this._masterType) {
            const entityMetaData: EntityMetaData<TSlave> = Reflect.getOwnMetadata(entityMetaKey, this.slaveType);
            const foreignKey: ForeignKeyMetaData<TSlave, TMaster> = entityMetaData.foreignKeys[this.foreignKeyName];
            this._masterType = foreignKey.masterType;
        }

        return this._masterType;
    }
    public get relationMaps(): {[key in keyof TSlave]?: keyof TMaster } {
        if (!this._relationMaps) {
            const entityMetaData: EntityMetaData<TSlave> = Reflect.getOwnMetadata(entityMetaKey, this.slaveType);
            const foreignKey: ForeignKeyMetaData<TSlave, TMaster> = entityMetaData.foreignKeys[this.foreignKeyName];
            this._relationMaps = foreignKey.relationMaps;
        }
        return this._relationMaps;
    }
    constructor(public slaveType: IObjectType<TSlave>, public foreignKeyName: string, public relationType = RelationType.OneToOne) {

    }
}
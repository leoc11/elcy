import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { UniqueMetaData } from "./IndexMetaData";
import { RelationMetaData } from "./RelationMetaData";
import { genericType } from "./Types";
import { ForeignKeyMetaData } from "./ForeignKeyMetaData";

export class EntityMetaData<T> {
    public hasInheritance: boolean;
    public primaryKeys: string[] = [];
    public deleteProperty: string;
    public createDateProperty: string;
    public modifiedProperty: string;
    public members: string[] = [];
    public foreignKeys: { [key: string]: ForeignKeyMetaData<T, any> } = {};
    public uniques: { [key: string]: UniqueMetaData } = {};
    public computedMembers: { [key: string]: (item: IExpression<T>) => IExpression };
    public name: string;
    public defaultOrder: (item: T) => any;
    constructor(public type: genericType<T>, name?: string, defaultOrder?: (item: T) => any, hasInheritance?: boolean) {
        if (typeof name !== "undefined")
            this.name = name;
        if (typeof defaultOrder !== "undefined")
            this.defaultOrder = defaultOrder;
        if (typeof hasInheritance !== "undefined")
            this.hasInheritance = hasInheritance;
    }
}

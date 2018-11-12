import { GenericType, IObjectType, } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone, hashCode } from "../../Helper/Util";
import { IOrderQueryDefinition } from "../Interface/IOrderQueryDefinition";

export class CustomEntityExpression<T = any> implements IEntityExpression<T> {
    public isRelationData?: boolean;
    public select?: SelectExpression<T>;
    public columns: IColumnExpression[];
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.where((o) => o.isPrimary).toArray();
        }
        return this._primaryColumns;
    }
    private _primaryColumns: IColumnExpression[];
    constructor(public name: string, columns: IColumnExpression[], public readonly type: GenericType<T>, public alias: string, public defaultOrders: IOrderQueryDefinition[] = []) {
        this.columns = columns.select(o => {
            const clone = o.clone();
            clone.entity = this;
            if (clone.alias) {
                clone.columnName = clone.alias;
                clone.alias = null;
            }
            return clone;
        }).toArray();
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): IEntityExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const clone = new CustomEntityExpression(this.name, [], this.type, this.alias);
        replaceMap.set(this, clone);
        clone.columns = this.columns.select(o => resolveClone(o, replaceMap)).toArray();
        return clone;
    }
    public entityTypes: IObjectType[] = [];
    public hashCode() {
        return hashCode(this.name, hashCode(this.type.name, this.columns.length));
    }
}

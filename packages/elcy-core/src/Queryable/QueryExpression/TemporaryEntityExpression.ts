import { OrderDirection } from "../../Common/StringType";
import { GenericType, IObjectType, ValueType } from "../../Common/Type";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, resolveClone } from "../../Helper/Util";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class TemporaryEntityExpression<T extends object = object> implements IEntityExpression<T> {
    public get primaryColumns(): IColumnExpression<T>[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.filter((o) => o.isPrimary);
        }
        return this._primaryColumns;
    }
    constructor(public name: string, columns: IColumnExpression<T>[], public readonly type: GenericType<T>, public alias: string, public defaultOrders: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>> = []) {
        this.columns = columns.map((o) => {
            const clone = o.clone();
            clone.entity = this;
            if (clone.alias) {
                clone.columnName = clone.alias;
                clone.alias = null;
            }
            return clone;
        });
    }
    public columns: IColumnExpression<T>[];
    public entityTypes: IObjectType[] = [];
    public isRelationData?: boolean;
    public select?: SelectExpression<T>;
    private _primaryColumns: IColumnExpression<T>[];
    public clone(replaceMap?: Map<IExpression, IExpression>): IEntityExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const clone = new TemporaryEntityExpression(this.name, [], this.type, this.alias);
        replaceMap.set(this, clone);
        clone.columns = this.columns.map((o) => resolveClone(o, replaceMap));
        return clone;
    }
    public hashCode() {
        return hashCode(this.name, hashCode(this.type.name, this.columns.length));
    }
    public toString(): string {
        return `CustomEntity(${this.name})`;
    }
}

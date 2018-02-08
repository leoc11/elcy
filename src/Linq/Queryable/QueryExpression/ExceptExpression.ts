import { QueryBuilder } from "../../QueryBuilder";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { IObjectType } from "../../../Common/Type";
import { IColumnExpression } from "./IColumnExpression";
import { ComputedColumnExpression } from "./ComputedColumnExpression";
import { ColumnExpression } from "./ColumnExpression";

export class ExceptExpression<T> extends ProjectionEntityExpression<T> {
    public get columns(): IColumnExpression[] {
        if (!this._columns) {
            this._columns = this.select.columns.where((o) => !o.isShadow).select((o) => {
                if (o instanceof ComputedColumnExpression) {
                    return new ColumnExpression(this, o.alias!, o.type, o.isPrimary);
                }
                return new ColumnExpression(this, o.alias ? o.alias : o.property, o.type, o.isPrimary);
            }).toArray();
        }
        return this._columns;
    }
    constructor(public readonly select: SelectExpression<T>, public readonly select2: SelectExpression, public readonly alias: string, public readonly type: IObjectType<T> = Object as any) {
        super(select, alias, type);
        const SingleSelectExpression = require("./SingleSelectExpression").SingleSelectExpression;
        if (select instanceof SingleSelectExpression) {
            this.type = select.type as any;
        }
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        throw new Error("Method not implemented.");
    }
}

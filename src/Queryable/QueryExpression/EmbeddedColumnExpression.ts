import { IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IEntityExpression } from "./IEntityExpression";
import { EmbeddedColumnMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { IColumnExpression } from "./IColumnExpression";
import { ColumnExpression } from "./ColumnExpression";

export class EmbeddedColumnExpression<TE = any, T = any> implements IColumnExpression<TE, T> {
    public type: IObjectType<T>;
    public get columnName() {
        return this.prefix;
    }
    public entity: IEntityExpression<TE>;
    public propertyName: keyof TE;
    public prefix: string;
    public isPrimary = false;
    public columns: IColumnExpression[] = [];
    public selects: IColumnExpression[] = [];
    private isSelectAll = true;
    constructor(entity: IEntityExpression<TE>, public columnMetaData: EmbeddedColumnMetaData<TE, T>) {
        this.entity = entity;
        this.type = this.columnMetaData.type;
        this.propertyName = this.columnMetaData.propertyName;
        this.isPrimary = false;
        this.columns = columnMetaData.embeddedEntity.columns.select(o => {
            const col = new ColumnExpression(this.entity as any, o.type, o.propertyName, this.prefix + "_" + o.columnName, false, o.columnType);
            col.columnMetaData = o;
            return col;
        }).toArray();
        this.selects = this.columns.slice(0);
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder) {
        return this.toString(queryBuilder) as any;
    }
    public clone(entity?: IEntityExpression<TE>) {
        const clone = new EmbeddedColumnExpression(entity || this.entity, this.columnMetaData);
        clone.columns = this.columns.slice(0);
        return clone;
    }
    public clearDefaultColumns() {
        if (this.isSelectAll) {
            this.isSelectAll = false;
            for (const column of this.entity.columns)
                this.selects.remove(column);
        }
    }
}

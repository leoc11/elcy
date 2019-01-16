import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IObjectType } from "../../Common/Type";
import { hashCode, resolveClone } from "../../Helper/Util";
import { SelectExpression } from "./SelectExpression";
import { EntityExpression } from "./EntityExpression";
import { IQueryCommandExpression } from "./IQueryCommandExpression";
import { IColumnExpression } from "./IColumnExpression";
export class InsertIntoExpression<T = any> implements IQueryCommandExpression<void> {
    public get type() {
        return undefined as any;
    }
    public get parameters() {
        return this.select.parameters;
    }
    public get columns(): IColumnExpression<T>[] {
        return this.select.selects;
    }
    constructor(public entity: EntityExpression<T>, public select: SelectExpression) {
        this.select.isSelectOnly = true;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): InsertIntoExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const entity = resolveClone(this.entity, replaceMap);
        const select = resolveClone(this.select, replaceMap);
        const clone = new InsertIntoExpression(entity, select);
        replaceMap.set(this, clone);
        return clone;
    }
    public toQueryCommands(queryBuilder: QueryBuilder, parameters?: ISqlParameter[]): IQuery[] {
        queryBuilder.setParameters(parameters ? parameters : []);
        return queryBuilder.getSelectInsertQuery(this);
    }
    public execute() {
        return this as any;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return this.toQueryCommands(queryBuilder).select(o => o.query).toArray().join(";" + queryBuilder.newLine() + queryBuilder.newLine());
    }
    public buildParameter(params: { [key: string]: any }): ISqlParameter[] {
        return this.select.buildParameter(params);
    }
    public hashCode() {
        return hashCode("INSERT", this.select.hashCode());
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
}

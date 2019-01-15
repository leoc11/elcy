import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IQueryCommandExpression } from "./IQueryCommandExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { ValueExpressionTransformer } from "../../ExpressionBuilder/ValueExpressionTransformer";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IObjectType } from "../../Common/Type";
import { hashCode, resolveClone } from "../../Helper/Util";
import { IEntityExpression } from "./IEntityExpression";
import { EntityEntry } from "../../Data/EntityEntry";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { QueryVisitor } from "../../QueryBuilder/QueryVisitor";
import { EntityState } from "../../Data/EntityState";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
export class InsertExpression<T = any> implements IQueryCommandExpression<void> {
    public parameters: SqlParameterExpression[] = [];
    private _columns: IColumnExpression<T>[];
    public get columns(): IColumnExpression<T>[] {
        if (!this._columns && this.entity instanceof EntityExpression) {
            this._columns = this.entity.metaData.relations
                .where(o => !o.nullable && !o.isMaster && o.relationType === "one")
                .selectMany(o => o.relationColumns)
                .union(this.entity.metaData.columns)
                .except(this.entity.metaData.insertGeneratedColumns)
                .select(o => this.entity.columns.first(c => c.propertyName === o.propertyName)).toArray();
        }
        return this._columns;
    }

    public get type() {
        return undefined as any;
    }
    constructor(public readonly entity: IEntityExpression<T>, public readonly values: Array<{ [key in keyof T]?: IExpression<T[key]> }>, columns?: IColumnExpression<T>[]) {
        if (columns) this._columns = columns;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): InsertExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const entity = resolveClone(this.entity, replaceMap);
        const columns = this.columns.select(o => resolveClone(o, replaceMap)).toArray();
        const values = this.values.select(o => {
            const item: { [key in keyof T]?: IExpression<T[key]> } = {};
            for (const prop in o) {
                item[prop] = resolveClone(o[prop], replaceMap);
            }
            return item;
        }).toArray();
        const clone = new InsertExpression(entity, values, columns);
        replaceMap.set(this, clone);
        return clone;
    }
    public toQueryCommands(queryBuilder: QueryBuilder, parameters?: ISqlParameter[]): IQuery[] {
        queryBuilder.setParameters(parameters ? parameters : []);
        return queryBuilder.getInsertQuery(this);
    }
    public execute() {
        return this as any;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return this.toQueryCommands(queryBuilder).select(o => o.query).toArray().join(";" + queryBuilder.newLine() + queryBuilder.newLine());
    }
    public buildParameter(params: { [key: string]: any }): ISqlParameter[] {
        const result: ISqlParameter[] = [];
        const valueTransformer = new ValueExpressionTransformer(params);
        for (const sqlParameter of this.parameters) {
            const value = sqlParameter.execute(valueTransformer);
            result.push({
                name: sqlParameter.name,
                parameter: sqlParameter,
                value: value
            });
        }
        return result;
    }
    public hashCode() {
        return hashCode("INSERT", hashCode(this.entity.name, this.values.select(o => {
            let hash = 0;
            for (const prop in o) {
                hash += hashCode(prop, o[prop].hashCode());
            }
            return hash;
        }).sum()));
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
}

export const insertEntryExp = <T>(insertExp: InsertExpression<T>, entry: EntityEntry<T>, columns: Iterable<IColumnMetaData<T>>, relations: Iterable<IRelationMetaData<T>>, visitor: QueryVisitor, queryParameters: ISqlParameter[]) => {
    const itemExp: { [key in keyof T]?: IExpression<T[key]> } = {};
    for (const col of columns) {
        let value = entry.entity[col.propertyName];
        if (value !== undefined) {
            let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), col.type), col);
            const paramv: ISqlParameter = {
                name: "",
                parameter: param,
                value: value
            };
            queryParameters.push(paramv);
            itemExp[col.propertyName] = param;
        }
    }

    for (const rel of relations) {
        const parentEntity = entry.entity[rel.propertyName] as any;
        if (parentEntity) {
            const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
            const isGeneratedPrimary = parentEntry.state === EntityState.Added && parentEntry.metaData.hasIncrementPrimary;
            for (const [col, parentCol] of rel.relationMaps) {
                let paramExp = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), parentCol.type), parentCol);
                if (isGeneratedPrimary) {
                    // TODO: get value from parent.
                    const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.dbSet.metaData).indexOf(parentEntry);
                    paramExp = new SqlParameterExpression(`${parentEntry.metaData.name}`, new MemberAccessExpression(new ParameterExpression(index.toString(), parentEntry.metaData.type), parentCol.columnName), parentCol);
                    insertExp.parameters.push(paramExp);
                }
                else {
                    let value = parentEntity[parentCol.propertyName];
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: paramExp,
                        value: value
                    };
                    queryParameters.push(paramv);
                }

                itemExp[col.propertyName] = paramExp;
            }
        }
    }

    insertExp.values.push(itemExp);
    return itemExp;
};
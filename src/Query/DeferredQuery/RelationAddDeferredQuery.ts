import { ColumnGeneration } from "../../Common/Enum";
import { DbSet } from "../../Data/DbSet";
import { EntityState } from "../../Data/EntityState";
import { RelationEntry } from "../../Data/RelationEntry";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { NotEqualExpression } from "../../ExpressionBuilder/Expression/NotEqualExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { hasFlags, hashCode, hashCodeAdd, isNull } from "../../Helper/Util";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { IQueryResult } from "../IQueryResult";
import { IQueryVisitor } from "../IQueryVisitor";
import { DMLDeferredQuery } from "./DMLDeferredQuery";

export class RelationAddDeferredQuery<T1, T2, TD> extends DMLDeferredQuery<any> {
    protected get insertProperties() {
        if (!this._insertProperties && this.entry.slaveRelation.relationData) {
            this._insertProperties = this.entry.slaveRelation.relationData.columns
                .where((o) => !hasFlags(o.generation, ColumnGeneration.Insert))
                .where((o) => !(o.defaultExp && isNull(this.entry.relationData[o.propertyName])))
                .select((o) => o.propertyName as keyof TD)
                .toArray();
        }
        return this._insertProperties;
    }
    constructor(protected readonly entry: RelationEntry<T1, T2, TD>, public autoFinalize: boolean = true) {
        super((entry.slaveRelation.relationData
            ? new DbSet(entry.slaveRelation.relationData.type, entry.slaveEntry.dbSet.dbContext)
            : entry.slaveEntry.dbSet
        ).parameter({ entry: entry }));
        this.relationId = {};
        this.queryable.parameter({ relationId: this.relationId });
    }
    public relationId: { [K: string]: any };
    private _finalizeable: boolean;
    private _insertProperties: Array<keyof TD>;
    public finalize() {
        if (!this._finalizeable) return;
        this._finalizeable = false;

        this.entry.acceptChanges();
    }
    protected buildQueries(visitor: IQueryVisitor): QueryExpression[] {
        const results: QueryExpression[] = [];
        if (this.entry.slaveRelation.relationData) {
            // create new data entity
            const queryExp = this.queryable.buildQuery(visitor) as SelectExpression;
            const value: { [K in keyof TD]?: IExpression } = {};
            const relationParam = new ParameterExpression("relationId", Object);
            const dataEntity = new MemberAccessExpression(new ParameterExpression<RelationEntry<T1, T2, TD>>("entry", RelationEntry), "relationData");
            for (const prop of this.insertProperties) {
                const relationIdValue = new MemberAccessExpression(relationParam, prop);
                const entityValue = new MemberAccessExpression(dataEntity, prop);
                const relationIdExist = new NotEqualExpression(relationIdValue, new ValueExpression(null));
                value[prop] = queryExp.addSqlParameter(visitor.newAlias("param"), new TernaryExpression(relationIdExist, relationIdValue, entityValue));
            }
            const slaveEntity = new MemberAccessExpression(new MemberAccessExpression(new ParameterExpression<RelationEntry<T1, T2, TD>>("entry", RelationEntry), "slaveEntry"), "entity");
            for (const [sCol, tCol] of this.entry.slaveRelation.relationData.targetRelationMaps) {
                const relationIdValue = new MemberAccessExpression(relationParam, sCol.propertyName);
                const entityValue = new MemberAccessExpression(slaveEntity, tCol.propertyName as keyof T1);
                const relationIdExist = new NotEqualExpression(relationIdValue, new ValueExpression(null));
                const oldParam = value[sCol.propertyName];
                if (oldParam) {
                    queryExp.parameterTree.node.delete(oldParam);
                }
                value[sCol.propertyName] = queryExp.addSqlParameter(visitor.newAlias("param"), new TernaryExpression(relationIdExist, relationIdValue, entityValue));
            }
            const masterEntity = new MemberAccessExpression(new MemberAccessExpression(new ParameterExpression<RelationEntry<T1, T2, TD>>("entry", RelationEntry), "masterEntry"), "entity");
            for (const [sCol, tCol] of this.entry.slaveRelation.relationData.sourceRelationMaps) {
                const relationIdValue = new MemberAccessExpression(relationParam, sCol.propertyName);
                const entityValue = new MemberAccessExpression(masterEntity, tCol.propertyName as keyof T2);
                const relationIdExist = new NotEqualExpression(relationIdValue, new ValueExpression(null));
                const oldParam = value[sCol.propertyName];
                if (oldParam) {
                    queryExp.parameterTree.node.delete(oldParam);
                }
                value[sCol.propertyName] = queryExp.addSqlParameter(visitor.newAlias("param"), new TernaryExpression(relationIdExist, relationIdValue, entityValue));
            }
            results.push(new InsertExpression(queryExp.entity, [value]));
        }

        if (this.entry.slaveEntry.state !== EntityState.Added && this.entry.slaveRelation.relationType === "one") {
            const queryExp = (this.entry.slaveRelation.relationData ? this.entry.slaveEntry.dbSet.parameter({ entry: this.entry }) : this.queryable).buildQuery(visitor) as SelectExpression<T1>;
            const slaveEntity = new MemberAccessExpression(new MemberAccessExpression(new ParameterExpression<RelationEntry<T1, T2, TD>>("entry", RelationEntry), "slaveEntry"), "entity");
            for (const colExp of queryExp.entity.primaryColumns) {
                const parameter = queryExp.addSqlParameter(visitor.newAlias("param"), new MemberAccessExpression(slaveEntity, colExp.propertyName, colExp.type), colExp.columnMeta);
                queryExp.addWhere(new StrictEqualExpression(colExp, parameter));
            }

            // NOTE: is concurrency handling needed for one-many relation?

            const setter: { [K in keyof T1]?: IExpression } = {};
            const masterEntity = new MemberAccessExpression(new MemberAccessExpression(new ParameterExpression<RelationEntry<T1, T2, TD>>("entry", RelationEntry), "masterEntry"), "entity");
            const relationParam = new ParameterExpression("relationId", Object);
            for (const [sCol, tCol] of this.entry.slaveRelation.relationMaps) {
                const relationIdValue = new MemberAccessExpression(relationParam, sCol.propertyName);
                const relationIdExist = new NotEqualExpression(relationIdValue, new ValueExpression(null));
                const entityValue = new MemberAccessExpression(masterEntity, tCol.propertyName);
                setter[sCol.propertyName] = queryExp.addSqlParameter(visitor.newAlias("param"), new TernaryExpression(relationIdExist, relationIdValue, entityValue));
            }

            const updateExp = new UpdateExpression(queryExp, setter);
            updateExp.parameterTree = queryExp.parameterTree;
            results.push(updateExp);
        }

        return results;
    }
    protected resultParser(results: IQueryResult[]) {
        const effectedRow = super.resultParser(results);

        this._finalizeable = true;
        if (this.autoFinalize) {
            this.finalize();
        }
        return effectedRow;
    }
    protected getQueryCacheKey() {
        let propCode = 0;
        if (this.insertProperties) {
            propCode = this.insertProperties.select((o) => hashCode(o)).sum();
        }
        if (this.entry.slaveEntry.state !== EntityState.Added && this.entry.slaveRelation.relationType === "one") {
            propCode = hashCodeAdd(propCode, 1);
        }
        return hashCodeAdd(hashCode("RELATIONADD", super.getQueryCacheKey()), hashCode(this.entry.slaveRelation.fullName, propCode));
    }
}

import { DbSet } from "../../Data/DbSet";
import { EntityState } from "../../Data/EntityState";
import { RelationEntry } from "../../Data/RelationEntry";
import { RelationState } from "../../Data/RelationState";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
import { DeleteExpression } from "../../Queryable/QueryExpression/DeleteExpression";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { IQueryResult } from "../IQueryResult";
import { IQueryVisitor } from "../IQueryVisitor";
import { DMLDeferredQuery } from "./DMLDeferredQuery";

export class RelationDeleteDeferredQuery<T1, T2, TD> extends DMLDeferredQuery<any> {
    constructor(protected readonly entry: RelationEntry<T1, T2, TD>, public autoFinalize: boolean = true) {
        super((entry.slaveRelation.relationData
            ? new DbSet(entry.slaveRelation.relationData.type, entry.slaveEntry.dbSet.dbContext)
            : entry.slaveEntry.dbSet
        ).parameter({ entry: entry }));
        this.queryable.parameter({ relationId: this.relationId });
    }
    public relationId: { [K: string]: any };
    private _finalizeable: boolean;
    public finalize() {
        if (!this._finalizeable) return;
        this._finalizeable = false;

        this.entry.acceptChanges();
    }
    protected buildQueries(visitor: IQueryVisitor): QueryExpression[] {
        const results: QueryExpression[] = [];

        // Delete relation Data
        if (this.entry.slaveRelation.relationData) {
            const queryExp = this.queryable.buildQuery(visitor) as SelectExpression<TD>;
            const dataEntity = new MemberAccessExpression(new ParameterExpression<RelationEntry<T1, T2, TD>>("entry", RelationEntry), "relationData");
            for (const colExp of queryExp.entity.primaryColumns) {
                const parameter = queryExp.addSqlParameter(visitor.newAlias("param"), new MemberAccessExpression(dataEntity, colExp.propertyName, colExp.type), colExp.columnMeta);
                queryExp.addWhere(new StrictEqualExpression(colExp, parameter));
            }
            results.push(new DeleteExpression(queryExp, this.entry.slaveRelation.relationData.deletedColumn ? "soft" : "hard"));
        }

        if (this.entry.slaveEntry.state !== EntityState.Deleted
            && this.entry.slaveRelation.relationType === "one"
            // Skip if same relation being added (change master)
            && !(this.entry.slaveEntry.relationMap[this.entry.slaveRelation.propertyName] || []).asEnumerable()
                .any(([, o]) => o.state === RelationState.Added)) {
            const queryExp = (this.entry.slaveRelation.relationData ? this.entry.slaveEntry.dbSet.parameter({ entry: this.entry }) : this.queryable).buildQuery(visitor) as SelectExpression<T1>;
            const slaveEntity = new MemberAccessExpression(new MemberAccessExpression(new ParameterExpression<RelationEntry<T1, T2, TD>>("entry", RelationEntry), "slaveEntry"), "entity");
            for (const colExp of queryExp.entity.primaryColumns) {
                const parameter = queryExp.addSqlParameter(visitor.newAlias("param"), new MemberAccessExpression(slaveEntity, colExp.propertyName, colExp.type), colExp.columnMeta);
                queryExp.addWhere(new StrictEqualExpression(colExp, parameter));
            }

            if (this.entry.slaveRelation.nullable) {
                // Update Foreign Key. Set to NULL
                const setter: { [K in keyof T1]?: IExpression } = {};
                for (const sCol of this.entry.slaveRelation.relationColumns) {
                    setter[sCol.propertyName] = new ValueExpression(null);
                }

                results.push(new UpdateExpression(queryExp, setter));
            }
            else {
                // Delete slave entity
                results.push(new DeleteExpression(queryExp, this.entry.slaveEntry.metaData.deletedColumn ? "soft" : "hard"));
            }
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
        const relCode = ~(this.entry.slaveEntry.state !== EntityState.Deleted
            && this.entry.slaveRelation.relationType === "one"
            // Skip if same relation being added (change master)
            && !(this.entry.slaveEntry.relationMap[this.entry.slaveRelation.propertyName] || []).asEnumerable()
                .any(([, o]) => o.state === RelationState.Added));

        return hashCodeAdd(hashCode("RELATIONDELETE", super.getQueryCacheKey()), hashCode(this.entry.slaveRelation.fullName, relCode));
    }
}

import { DeleteMode } from "../../Common/StringType";
import { EntityEntry } from "../../Data/EntityEntry";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
import { DeleteExpression } from "../../Queryable/QueryExpression/DeleteExpression";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQueryResult } from "../IQueryResult";
import { IQueryVisitor } from "../IQueryVisitor";
import { DMLDeferredQuery } from "./DMLDeferredQuery";

export class DeleteDeferredQuery<T> extends DMLDeferredQuery<T> {
    constructor(protected readonly entry: EntityEntry<T>, protected readonly mode: DeleteMode, public autoFinalize: boolean = true) {
        super(entry.dbSet.parameter({ entry: entry }));
        if (this.queryOption.beforeDelete) {
            this.queryOption.beforeDelete(this.entry.entity, { mode: this.mode });
        }
        if (this.entry.metaData.beforeDelete) {
            this.entry.metaData.beforeDelete(this.entry.entity, { mode: this.mode });
        }
        if (this.dbContext.beforeDelete) {
            this.dbContext.beforeDelete(this.entry.entity, { mode: this.mode });
        }
    }
    private _finalizeable: boolean;
    public finalize() {
        if (!this._finalizeable) return;
        this._finalizeable = false;

        this.entry.acceptChanges();
        if (this.queryOption.afterDelete) {
            this.queryOption.afterDelete(this.entry.entity, { mode: this.mode });
        }
        if (this.entry.metaData.afterDelete) {
            this.entry.metaData.afterDelete(this.entry.entity, { mode: this.mode });
        }
        if (this.dbContext.afterDelete) {
            this.dbContext.afterDelete(this.entry.entity, { mode: this.mode });
        }
    }
    protected buildQueries(visitor: IQueryVisitor): Array<QueryExpression<T>> {
        const commandQuery = this.queryable.buildQuery(visitor) as SelectExpression<T>;
        for (const colExp of commandQuery.entity.primaryColumns) {
            const parameter = commandQuery.addSqlParameter(visitor.newAlias("param"), new MemberAccessExpression(new MemberAccessExpression(new ParameterExpression<EntityEntry<T>>("entry", EntityEntry), "entity"), colExp.propertyName, colExp.type), colExp.columnMeta);
            commandQuery.addWhere(new StrictEqualExpression(colExp, parameter));
        }

        return [new DeleteExpression(commandQuery, this.mode)];
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
        return hashCodeAdd(hashCode("DELETE", super.getQueryCacheKey()), hashCode(this.mode));
    }
}

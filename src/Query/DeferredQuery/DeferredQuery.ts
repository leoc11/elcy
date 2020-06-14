import { Defer } from "../../Common/Defer";
import { INodeTree, ParameterStack } from "../../Common/ParameterStack";
import { DbContext } from "../../Data/DbContext";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionExecutor } from "../../ExpressionBuilder/ExpressionExecutor";
import { isNull } from "../../Helper/Util";
import { Diagnostic } from "../../Logger/Diagnostic";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { SqlTableValueParameterExpression } from "../../Queryable/QueryExpression/SqlTableValueParameterExpression";
import { IQuery } from "../IQuery";
import { IQueryOption } from "../IQueryOption";
import { IQueryResult } from "../IQueryResult";
import { IQueryTemplate } from "../IQueryTemplate";

export abstract class DeferredQuery<T = any> {
    constructor(
        protected readonly dbContext: DbContext,
        public readonly queryOption: IQueryOption
    ) {
        this.dbContext.deferredQueries.push(this);
    }
    public abstract queries: IQuery[];
    public value: T;
    protected resultRange: [number, number];
    private _defer: Defer<T>;
    public async execute(): Promise<T> {
        // if has been resolved, return
        if (this.value !== undefined) {
            return this.value;
        }
        // if being resolved.
        if (!this.dbContext.deferredQueries.contains(this)) {
            if (!this._defer) {
                this._defer = new Defer();
            }
            return this._defer;
        }

        await this.dbContext.executeDeferred();
        return this.value;
    }
    public abstract hashCode(): number;
    public toString() {
        return this.queries.select((o) => o.query).toArray().join("\n\n");
    }
    public resolve(result: IQueryResult[]) {
        let queries = this.queries;
        if (this.resultRange) {
            result = result.skip(this.resultRange[0]).take(this.resultRange[1]).toArray();
            queries = queries.skip(this.resultRange[0]).take(this.resultRange[1]).toArray();
        }

        this.value = this.resultParser(result, queries);
        if (this._defer) {
            this._defer.resolve(this.value);
        }
    }
    protected abstract resultParser(result: IQueryResult[], queries?: IQuery[]): T;
    protected tvpQueries(tvpMap: Map<SqlTableValueParameterExpression, any[]>, queries: IQuery[]) {
        if (tvpMap.size <= 0 || this.queryOption.supportTVP) {
            return queries;
        }

        const schemaBuilder = this.dbContext.schemaBuilder();

        let preQ: IQuery[] = [];
        let postQ: IQuery[] = [];
        for (const [tvpExp, arrayValues] of tvpMap) {
            const entityExp = new EntityExpression(tvpExp.entityMeta, "");
            let i = 0;
            const columns = entityExp.columns as ColumnExpression[];
            const insertQuery = new InsertExpression(entityExp, [], columns);
            for (const item of arrayValues) {
                const itemExp: { [key: string]: IExpression } = {};
                for (const col of columns) {
                    let valueExp: ValueExpression = null;
                    switch (col.propertyName) {
                        case "__index": {
                            valueExp = new ValueExpression(i++);
                            break;
                        }
                        case "__value": {
                            valueExp = new ValueExpression(item);
                            break;
                        }
                        default: {
                            const propVal = item[col.propertyName];
                            valueExp = new ValueExpression(!isNull(propVal) ? propVal : null);
                            break;
                        }
                    }
                    itemExp[col.propertyName] = valueExp;
                    if (!col.columnMeta.columnType) {
                        const colType = this.dbContext.queryBuilder.valueColumnType(valueExp.value);
                        col.columnMeta.columnType = colType.columnType as any;
                        if (colType.option) {
                            for (const prop in colType.option) {
                                col.columnMeta[prop] = colType.option[prop];
                            }
                        }
                    }
                }
                insertQuery.values.push(itemExp);
            }

            const createQ = schemaBuilder.createTable(tvpExp.entityMeta);
            const insertQ = this.dbContext.queryBuilder.toQuery(insertQuery, this.queryOption)
                .select((o) => this.toQuery(o, null, null)).toArray();
            const deleteQ = schemaBuilder.dropTable(tvpExp.entityMeta);
            preQ = preQ.concat(createQ).concat(insertQ);
            postQ = postQ.concat(deleteQ);
        }

        this.resultRange = [preQ.length, queries.length];
        return preQ.concat(queries).concat(postQ);
    }
    protected toQuery(template: IQueryTemplate, stackTree: INodeTree<ParameterStack>, tvpMap: Map<SqlTableValueParameterExpression, any[]>): IQuery {
        const paramTree = template.parameterTree;
        const timer = Diagnostic.timer();
        const result: IQuery = {
            comment: template.comment,
            type: template.type,
            query: template.query,
            parameters: {}
        };

        if (stackTree) {
            const queryBuilder = this.dbContext.queryBuilder;
            let paramTrees = [paramTree];
            let stackTrees = [stackTree];
            let i = 0;
            while (paramTrees.length > i) {
                const paramNode = paramTrees[i];
                const stackNode = stackTrees[i++];
                const valueTransformer = new ExpressionExecutor(stackNode.node);
                for (const param of paramNode.node) {
                    const value = valueTransformer.execute(param);
                    if (!this.queryOption.supportTVP && param instanceof SqlTableValueParameterExpression) {
                        tvpMap.set(param, value);
                    }
                    else if (param.isReplacer) {
                        result.query = result.query.replace(queryBuilder.toString(param), value);
                    }
                    else {
                        result.parameters[param.name] = this.dbContext.queryBuilder.toParameterValue(value, param.column);
                    }
                }
                if (paramNode.childrens.any()) {
                    paramTrees = paramTrees.concat(paramNode.childrens);
                    stackTrees = stackTrees.concat(stackNode.childrens);
                }
            }
            if (Diagnostic.enabled) {
                Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
            }
        }
        return result;
    }
}

import { INodeTree } from "../../Common/ParameterStack";
import { GenericType, IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { SqlParameterExpression } from "./SqlParameterExpression";
import { SqlTableValueParameterExpression } from "./SqlTableValueParameterExpression";

export abstract class QueryExpression<T = any> implements IExpression<T> {
    constructor() {
        this.parameterTree = {
            node: [],
            childrens: []
        };
    }
    public parameterTree: INodeTree<SqlParameterExpression[]>;
    public type: GenericType<T>;
    public abstract clone(replaceMap?: Map<IExpression, IExpression>): QueryExpression<T>;
    public abstract getEffectedEntities(): IObjectType[];
    public abstract hashCode(): number;

    public addSqlParameter<Tval>(name: string, valueExp: IExpression<Tval[]>, entityMeta?: EntityMetaData<Tval>): SqlTableValueParameterExpression<Tval>;
    public addSqlParameter<Tval>(name: string, valueExp: IExpression<Tval>, colMeta?: IColumnMetaData): SqlParameterExpression<Tval>;
    public addSqlParameter<Tval>(name: string, valueExp: IExpression<Tval>, entityOrColMeta?: IColumnMetaData | EntityMetaData<Tval>): SqlParameterExpression<Tval> | SqlTableValueParameterExpression<Tval> {
        let sqlParameter: SqlParameterExpression;
        if ((valueExp.type as any) === Array) {
            sqlParameter = new SqlTableValueParameterExpression(name, valueExp as IExpression<any>, entityOrColMeta as EntityMetaData<Tval>);
        }
        else {
            sqlParameter = new SqlParameterExpression(name, valueExp, entityOrColMeta as IColumnMetaData);
        }
        this.parameterTree.node.push(sqlParameter);
        return sqlParameter;
    }

    public replaceSqlParameter(input: SqlParameterExpression, replace: SqlParameterExpression) {
        const n = [this.parameterTree];
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < n.length; ++i) {
            const t = n[i];
            if (t.node.delete(input)) {
                t.node.push(replace);
                break;
            }
            if (t.childrens.any()) {
                for (const c of t.childrens) {
                    n.push(c);
                }
            }
        }
    }
}

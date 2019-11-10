import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { IObjectType, ValueType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { ObjectValueExpression } from "../ExpressionBuilder/Expression/ObjectValueExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";
import { resolveClone } from "./Util";

export const toObjectFunctionExpression = function <K, TR extends {
    [key in keyof TR]?: TR[key] & ValueType | ((item: any) => TR[key] & ValueType) | FunctionExpression<TR>;
}>(objectFn: TR, paramType: IObjectType, paramName: string, stack?: ParameterStack, type?: IObjectType): FunctionExpression<K> {
    const param = new ParameterExpression(paramName, paramType);
    const objectValue: {
        [key in keyof TR]?: IExpression;
    } = {};
    for (const prop in objectFn) {
        const value = objectFn[prop];
        let valueExp: IExpression;
        if (value instanceof FunctionExpression) {
            if (value.params.length > 0) {
                value.params[0].name = paramName;
            }
            valueExp = value.body;
        }
        else if (typeof value === "function") {
            const fnExp = ExpressionBuilder.parse(value as any, [paramType], stack);
            if (fnExp.params.length > 0) {
                fnExp.params[0].name = paramName;
            }
            valueExp = fnExp.body;
        }
        else {
            valueExp = new ValueExpression(value);
        }
        objectValue[prop] = valueExp;
    }
    const objExpression = new ObjectValueExpression(objectValue, type);
    return new FunctionExpression(objExpression, [param]) as any;
};

export const resolveTreeClone = (tree1: INodeTree<SqlParameterExpression[]>, replaceMap: Map<IExpression, IExpression>): INodeTree<SqlParameterExpression[]> => {
    return {
        childrens: tree1.childrens.select((o) => resolveTreeClone(o, replaceMap)).toArray(),
        node: tree1.node.select((o) => resolveClone(o, replaceMap)).toArray()
    };
};

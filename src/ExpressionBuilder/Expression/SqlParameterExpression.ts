import { ExpressionTransformer } from "../ExpressionTransformer";
import { ParameterExpression } from "./ParameterExpression";
import { IExpression } from "./IExpression";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";

export class SqlParameterExpression<T = any> extends ParameterExpression<T> {
    public select?: SelectExpression<T>;
    constructor(name: string, public readonly valueGetter: IExpression<T>) {
        super(name, valueGetter.type);
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return this.name;
    }
    public execute(transformer: ExpressionTransformer): any {
        return transformer.executeExpression(this);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const valueGetter = replaceMap.has(this.valueGetter) ? replaceMap.get(this.valueGetter) : this.valueGetter.clone(replaceMap);
        const clone = new SqlParameterExpression(this.name, valueGetter);
        clone.select = this.select;
        return clone;
    }
}

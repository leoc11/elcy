import { ExpressionTransformer } from "../ExpressionTransformer";
import { ParameterExpression } from "./ParameterExpression";
import { IExpression } from "./IExpression";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { getClone } from "../../Helper/Util";

export class SqlParameterExpression<T = any> extends ParameterExpression<T> {
    public select?: SelectExpression<T>;
    constructor(name: string, public readonly valueGetter: IExpression<T>, public readonly column?: IColumnMetaData) {
        super(name, valueGetter.type);
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return this.name;
    }
    public execute(transformer: ExpressionTransformer): any {
        return this.valueGetter.execute(transformer);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): SqlParameterExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const valueGetter = getClone(this.valueGetter, replaceMap);
        const clone = new SqlParameterExpression(this.name, valueGetter, this.column);
        clone.select = getClone(this.select, replaceMap);
        replaceMap.set(this, clone);
        return clone;
    }
}

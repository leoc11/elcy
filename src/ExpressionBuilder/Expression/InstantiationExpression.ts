import { IObjectType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
export class InstantiationExpression<TType> extends ExpressionBase<TType> {
    constructor(public type: IObjectType<TType>, public params: IExpression[]) {
        super(type);
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const paramStr = [];
        for (const param of this.params)
            paramStr.push(param.toString());
        return "new " + this.type.name + "(" + paramStr.join(", ") + ")";
    }
    public execute(transformer?: ExpressionTransformer) {
        const params = [];
        for (const param of this.params)
            params.push(param.execute(transformer));
        return new this.type(...params);
    }
    public clone() {
        return new InstantiationExpression(this.type, this.params);
    }
}

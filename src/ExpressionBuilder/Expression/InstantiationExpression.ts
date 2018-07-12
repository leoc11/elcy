import { IObjectType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class InstantiationExpression<TType> extends ExpressionBase<TType> {
    public static create<TType>(type: IObjectType<TType>, params: IExpression[]) {
        const result = new InstantiationExpression(type, params);
        if (params.every((param) => param instanceof ValueExpression)) {
            return ValueExpression.create(result);
        }

        return result;
    }
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

import { genericType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase } from "./IExpression";

export class ParameterExpression<TType = any> extends ExpressionBase<TType> {
    public static Create(name: string): ParameterExpression;
    public static Create<TType>(ctor: genericType<TType>, name: string): ParameterExpression<TType>;
    public static Create<TType>(ctor: genericType<TType> | string, name?: string) {
        if (typeof ctor === "string")
            return new ParameterExpression(ctor);
        if (typeof name === "undefined")
            throw new Error("Name must be specified");
        return new ParameterExpression(name, ctor);
    }
    constructor(public readonly name: string, type?: genericType<TType>) {
        super(type);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.toExpressionString(this);
        return this.name;
    }
    public execute(transformer: ExpressionTransformer): any {
        return transformer.parameters.get(this.name);
    }
}

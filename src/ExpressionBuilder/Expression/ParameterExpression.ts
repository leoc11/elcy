import { GenericType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase } from "./IExpression";

export class ParameterExpression<TType = any> extends ExpressionBase<TType> {
    public static Create(name: string): ParameterExpression<any>;
    public static Create<TType>(ctor: GenericType<TType>, name: string): ParameterExpression<TType>;
    public static Create<TType>(ctor: GenericType<TType> | string, name?: string) {
        if (typeof ctor === "string")
            return new ParameterExpression(ctor);
        if (typeof name === "undefined")
            throw new Error("Name must be specified");
        return new ParameterExpression(name, ctor);
    }
    constructor(public readonly name: string, type?: GenericType<TType>) {
        super(type);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return this.name;
    }
    public execute(transformer: ExpressionTransformer): any {
        return transformer.scopeParameters.get(this.name);
    }
    public clone() {
        return new ParameterExpression(this.name, this.type);
    }
}

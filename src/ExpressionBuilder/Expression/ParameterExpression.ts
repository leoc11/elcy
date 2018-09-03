import { GenericType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";

export class ParameterExpression<T = any> extends ExpressionBase<T> {
    public static create(name: string): ParameterExpression<any>;
    public static create<T>(ctor: GenericType<T>, name: string): ParameterExpression<T>;
    public static create<T>(ctor: GenericType<T> | string, name?: string) {
        if (typeof ctor === "string")
            return new ParameterExpression(ctor);
        if (typeof name === "undefined")
            throw new Error("Name must be specified");
        return new ParameterExpression(name, ctor);
    }
    constructor(public readonly name: string, type?: GenericType<T>) {
        super(type);
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
        return new ParameterExpression(this.name, this.type);
    }
}

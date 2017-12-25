import { ExpressionBase } from "./IExpression";
import { genericType } from "../../Common/Type";

export class ParameterExpression<TType = any> extends ExpressionBase<TType> {
    public static Create(name: string): ParameterExpression;
    public static Create<TType>(ctor: { new(): TType }, name: string): ParameterExpression<TType>;
    public static Create<TType>(ctor: { new(): TType } | string, name?: string) {
        if (typeof ctor === "string")
            return new ParameterExpression(ctor);
        if (typeof name === "undefined")
            throw new Error("Name must be specified");
        return new ParameterExpression(name, ctor);
    }
    constructor(protected name: string, type?: genericType<TType>) {
        super(type);
    }

    public ToString(): string {
        return this.name;
    }
    public Execute(): TType {
        throw new Error("Method not implemented.");
    }

}

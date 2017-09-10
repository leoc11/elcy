import { ExpressionBase } from "./IExpression";

export class ParameterExpression<TType = any> implements ExpressionBase<TType> {
    public static Create(name: string): ParameterExpression;
    public static Create<TType>(ctor: { new(): TType }, name: string): ParameterExpression<TType>;
    public static Create<TType>(ctor: { new(): TType } | string, name?: string) {
        if (typeof ctor === "string")
            return new ParameterExpression(null, ctor);
        if (typeof name === "undefined")
            throw new Error("Name must be specified");
        return new ParameterExpression(ctor, name);
    }
    constructor(public Type: { new(): TType } | null, protected Name: string) {
    }

    public ToString(): string {
        return this.Name;
    }
    public Execute() {
        throw new Error("Method not implemented.");
    }

}

import { GenericType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { IExpression } from "./IExpression";
import { hashCode } from "../../Helper/Util";

export class ParameterExpression<T = any> implements IExpression<T> {
    public static create(name: string): ParameterExpression<any>;
    public static create<T>(ctor: GenericType<T>, name: string): ParameterExpression<T>;
    public static create<T>(ctor: GenericType<T> | string, name?: string) {
        if (typeof ctor === "string")
            return new ParameterExpression(ctor);
        if (typeof name === "undefined")
            throw new Error("Name must be specified");
        return new ParameterExpression(name, ctor);
    }
    public type: GenericType<T>;
    public itemType?: GenericType<T>;
    constructor(public name: string, type?: GenericType<T>) {
        this.type = type;
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return this.name;
    }
    public execute(transformer: ExpressionTransformer): any {
        return transformer.executeExpression(this);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): ParameterExpression<T> {
        return this;
    }
    public hashCode() {
        return this.type ? hashCode(this.type.name) : 27;
    }
}

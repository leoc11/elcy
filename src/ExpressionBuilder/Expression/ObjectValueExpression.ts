import { IObjectType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";

export class ObjectValueExpression<T extends { [Key: string]: IExpression }> extends ExpressionBase<T> {
    public static Create<TType extends { [Key: string]: IExpression }>(objectValue: TType) {
        const result = new ObjectValueExpression(objectValue);
        let isAllValue = true;
        for (const prop in objectValue) {
            if (!(objectValue[prop] instanceof ValueExpression)) {
                isAllValue = false;
                break;
            }
        }
        if (isAllValue)
            return ValueExpression.Create<TType>(objectValue);

        return result;
    }
    public object: T;
    public type: IObjectType<T>;
    constructor(objectValue: T, type?: IObjectType<T>) {
        super();
        this.object = objectValue;
        this.type = type ? type : objectValue.constructor as IObjectType<T>;
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const itemString = [];
        for (const item in this.object)
            itemString.push(item + ": " + this.object[item].toString());
        return "{" + itemString.join(", ") + "}";
    }
    public execute(transformer: ExpressionTransformer): T {
        const objectValue: { [Key: string]: IExpression } = {};
        for (const prop in this.object)
            objectValue[prop] = this.object[prop].execute(transformer);
        return objectValue as T;
    }
    public clone() {
        return new ObjectValueExpression(this.object, this.type);
    }
}

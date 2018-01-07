import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";

export class ObjectValueExpression<TType extends { [Key: string]: IExpression }> extends ExpressionBase<TType> {
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
    public object: TType;
    constructor(objectValue: TType) {
        super();
        this.object = objectValue;
    }

    public toString(transformer: ExpressionTransformer) {
        const itemString = [];
        for (const item in this.object)
            itemString.push(item + ": " + this.object[item].toString(transformer));
        return "{" + itemString.join(", ") + "}";
    }
    public execute(transformer: ExpressionTransformer): TType {
        const objectValue: { [Key: string]: IExpression } = {};
        for (const prop in this.object)
            objectValue[prop] = this.object[prop].execute(transformer);
        return objectValue as TType;
    }
}

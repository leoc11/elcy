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
            return ValueExpression.Create<TType>(result);

        return result;
    }
    public Object: TType;
    constructor(objectValue: TType) {
        super();
        this.Object = objectValue;
    }

    public ToString() {
        const itemString = [];
        for (const item in this.Object)
            itemString.push(item + ": " + this.Object[item].ToString());
        return "{" + itemString.join(", ") + "}";
    }
    public Execute() {
        const objectValue: { [key: string]: any } = {};
        for (const prop in this.Object)
            objectValue[prop] = this.Object[prop].Execute();
        return objectValue;
    }
}

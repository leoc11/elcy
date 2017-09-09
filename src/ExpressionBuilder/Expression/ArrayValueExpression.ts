import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";

export class ArrayValueExpression<TType> extends ExpressionBase<TType[]> {
    public static Create<TType>(...values: Array<IExpression<TType>>) {
        const result = new ArrayValueExpression<TType>(...values);
        if (values.every((param) => param instanceof ValueExpression))
            return ValueExpression.Create<TType[]>(result);

        return result;
    }
    public Items: Array<IExpression<TType>>;
    constructor(...items: Array<IExpression<TType>>) {
        super();
        this.Items = items;
    }

    public ToString() {
        const itemString = [];
        for (const item of this.Items)
            itemString.push(item.ToString());
        return "[" + itemString.join(", ") + "]";
    }
    public Execute() {
        return this.Items;
    }

}

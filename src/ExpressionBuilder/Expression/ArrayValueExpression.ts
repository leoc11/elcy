import { ExpressionTransformer } from "../ExpressionTransformer";
import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { resolveClone, hashCodeAdd } from "../../Helper/Util";
import { GenericType } from "../../Common/Type";

export class ArrayValueExpression<T = any> implements IExpression<T[]> {
    public static create<T>(...values: Array<IExpression<T>>) {
        const result = new ArrayValueExpression<T>(...values);
        if (values.every((param) => param instanceof ValueExpression))
            return ValueExpression.create<T[]>(result);

        return result;
    }
    public type = Array;
    public itemType?: GenericType<T>;
    public items: Array<IExpression<T>>;
    constructor(...items: Array<IExpression<T>>) {
        this.items = items;
        if (items.length > 0) {
            this.itemType = items.first().type;
        }
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const itemString = [];
        for (const item of this.items)
            itemString.push(item.toString());
        return "[" + itemString.join(", ") + "]";
    }
    public execute(transformer: ExpressionTransformer) {
        const arrayValues = [];
        for (const item of this.items)
            arrayValues.push(item.execute(transformer));
        return arrayValues;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const items = this.items.select(o => resolveClone(o, replaceMap)).toArray();
        const clone = new ArrayValueExpression(...items);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        let hash = 0;
        this.items.each((o, index) => {
            hash += hashCodeAdd(index, o.hashCode());
        });
        return hash;
    }
}

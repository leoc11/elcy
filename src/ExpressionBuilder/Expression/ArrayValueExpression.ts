import { IExpression } from "./IExpression";
import { resolveClone, hashCodeAdd } from "../../Helper/Util";
import { GenericType } from "../../Common/Type";

export class ArrayValueExpression<T = any> implements IExpression<T[]> {
    public type = Array;
    public itemType?: GenericType<T>;
    public items: Array<IExpression<T>>;
    constructor(...items: Array<IExpression<T>>) {
        this.items = items;
        if (items.length > 0) {
            this.itemType = items.first().type;
        }
    }

    public toString(): string {
        const itemString = [];
        for (const item of this.items)
            itemString.push(item.toString());
        return "[" + itemString.join(", ") + "]";
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

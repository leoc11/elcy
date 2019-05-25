import { GenericType } from "../../Common/Type";
import { hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IExpression } from "./IExpression";

export class ArrayValueExpression<T = any> implements IExpression<T[]> {
    constructor(...items: Array<IExpression<T>>) {
        this.items = items;
        if (items.length > 0) {
            this.itemType = items.first().type;
        }
    }
    public items: Array<IExpression<T>>;
    public itemType?: GenericType<T>;
    public type = Array;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const items = this.items.select((o) => resolveClone(o, replaceMap)).toArray();
        const clone = new ArrayValueExpression(...items);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        let hash = 0;
        this.items.forEach((o, index) => {
            hash += hashCodeAdd(index, o.hashCode());
        });
        return hash;
    }

    public toString(): string {
        const itemString = [];
        for (const item of this.items) {
            itemString.push(item.toString());
        }
        return "[" + itemString.join(", ") + "]";
    }
}

import { Enumerable } from "@elcy/enumerable";
import { GenericType, IObjectType, PrimitiveType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class ConcatExpression<T extends object> extends ProjectionEntityExpression<T> {
    constructor(type?: PrimitiveType<T>, ...subSelects: [SelectExpression<T>, SelectExpression<T>, ...SelectExpression<T>[]]);
    constructor(type?: GenericType<T>, ...subSelects: [SelectExpression<T>, SelectExpression<T>, ...SelectExpression<T>[]]);
    constructor(type?: GenericType<T>, ...subSelects: [SelectExpression<T>, SelectExpression<T>, ...SelectExpression<T>[]]) {
        super(subSelects[0], type);
        let entityTypes = Enumerable.from<IObjectType>([]);
        for (const subSelect of subSelects) {
            subSelect.isSubSelect = true;
            this.paramExps = this.paramExps.concat(subSelect.paramExps);
            entityTypes = entityTypes.concat(subSelect.entity.entityTypes);
        }
        this.entityTypes = entityTypes.distinct().toArray();
        this.subSelects = subSelects;
    }
    public subSelects: SelectExpression<T>[];
    public declare readonly entityTypes: IObjectType[];
    public override clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const subSelects = this.subSelects.map(o => resolveClone(o, replaceMap));
        const clone = new ConcatExpression(this.type, ...subSelects as [SelectExpression<T>, SelectExpression<T>, ...SelectExpression<T>[]]);
        replaceMap.set(this, clone);
        return clone;
    }
    public override hashCode() {
        return this.subSelects.reduceRight((r, o, i) => i === 0 ? o.hashCode() : hashCodeAdd(hashCode("CONCAT", r), o.hashCode()), 0);
    }
    public override toString(): string {
        return `Concat(${this.subSelects.map(o => o.toString()).join(", ")})`;
    }
}

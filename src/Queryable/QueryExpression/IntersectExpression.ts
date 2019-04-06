import { IObjectType } from "../../Common/Type";
import { SelectExpression } from "./SelectExpression";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone, hashCodeAdd, hashCode } from "../../Helper/Util";

export class IntersectExpression<T> extends ProjectionEntityExpression<T> {
    public readonly entityTypes: IObjectType[];
    constructor(public readonly subSelect: SelectExpression<T>, public readonly subSelect2: SelectExpression, public readonly type: IObjectType<T> = Object as any) {
        super(subSelect, type);
        this.subSelect2.isSubSelect = true;
        this.entityTypes = this.subSelect.entity.entityTypes.concat(this.subSelect2.entity.entityTypes).distinct().toArray();
    }
    public toString(): string {
        return `Intersect(${this.subSelect.toString()}, ${this.subSelect2.toString()})`;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const select = resolveClone(this.subSelect, replaceMap);
        const select2 = resolveClone(this.subSelect2, replaceMap);
        const clone = new IntersectExpression(select, select2, this.type);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("INTERSECT", this.subSelect.hashCode()), this.subSelect2.hashCode());
    }
}

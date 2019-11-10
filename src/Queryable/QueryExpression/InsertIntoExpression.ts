import { IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, resolveClone } from "../../Helper/Util";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { QueryExpression } from "./QueryExpression";
import { SelectExpression } from "./SelectExpression";
export class InsertIntoExpression<T = any> extends QueryExpression<void> {
    public get columns(): Array<IColumnExpression<T>> {
        return this.select.selects;
    }
    public get parameterTree() {
        return this.select.parameterTree;
    }
    public get type() {
        return undefined as any;
    }
    constructor(public entity: EntityExpression<T>, public select: SelectExpression) {
        super();
        this.select.isSelectOnly = true;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): InsertIntoExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const select = resolveClone(this.select, replaceMap);
        const clone = new InsertIntoExpression(entity, select);
        replaceMap.set(this, clone);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
    public hashCode() {
        return hashCode("INSERT", this.select.hashCode());
    }
    public toString(): string {
        return `InsertInto({
Entity:${this.entity.toString()},
Select:${this.select.toString()}
})`;
    }
}

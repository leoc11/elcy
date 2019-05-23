import { IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, resolveClone } from "../../Helper/Util";
import { IQueryOption } from "../../Query/IQueryOption";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryExpression } from "./IQueryExpression";
import { SelectExpression } from "./SelectExpression";
export class InsertIntoExpression<T = any> implements IQueryExpression<void> {
    public option: IQueryOption;
    public get type() {
        return undefined as any;
    }
    public get paramExps() {
        return this.select.paramExps;
    }
    public get columns(): Array<IColumnExpression<T>> {
        return this.select.selects;
    }
    constructor(public entity: EntityExpression<T>, public select: SelectExpression) {
        this.select.isSelectOnly = true;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): InsertIntoExpression<T> {
        if (!replaceMap) { replaceMap = new Map(); }
        const entity = resolveClone(this.entity, replaceMap);
        const select = resolveClone(this.select, replaceMap);
        const clone = new InsertIntoExpression(entity, select);
        replaceMap.set(this, clone);
        return clone;
    }
    public toString(): string {
        return `InsertInto({
Entity:${this.entity.toString()},
Select:${this.select.toString()}
})`;
    }
    public hashCode() {
        return hashCode("INSERT", this.select.hashCode());
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
}

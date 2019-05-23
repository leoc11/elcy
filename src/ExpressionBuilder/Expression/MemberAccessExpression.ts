import { GenericType } from "../../Common/Type";
import { columnMetaKey, relationMetaKey } from "../../Decorator/DecoratorKey";
import { hashCode, resolveClone } from "../../Helper/Util";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { IExpression } from "./IExpression";
import { IMemberOperatorExpression } from "./IMemberOperatorExpression";
export class MemberAccessExpression<TE, K extends keyof TE, T = TE[K]> implements IMemberOperatorExpression<TE, T> {
    public get type() {
        if (!this._type) {
            if (this.objectOperand.type) {
                const columnMeta: ColumnMetaData = Reflect.getOwnMetadata(columnMetaKey, this.objectOperand.type, this.memberName);
                const relationMeta: RelationMetaData<TE, any> = Reflect.getOwnMetadata(relationMetaKey, this.objectOperand.type, this.memberName);
                if (columnMeta) {
                    this._type = columnMeta.type;
                }
                else if (relationMeta) {
                    if (relationMeta.relationType === "one") {
                        this._type = relationMeta.target.type;
                    }
                    else {
                        this._type = Array as any;
                        this.itemType = relationMeta.target.type;
                    }
                }
                else {
                    const val = this.objectOperand.type.prototype[this.memberName];
                    if (val) {
                        this._type = val.constructor;
                    }
                }
            }
        }
        return this._type;
    }
    public itemType?: GenericType;
    private _type: GenericType<T>;
    constructor(public objectOperand: IExpression<TE>, public memberName: K) { }
    public toString(): string {
        let result = this.objectOperand.toString();
        result += "." + this.memberName;
        return result;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) { replaceMap = new Map(); }
        const objectOperand = resolveClone(this.objectOperand, replaceMap);
        const clone = new MemberAccessExpression<TE, K, T>(objectOperand, this.memberName);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode("." + this.memberName, this.objectOperand.hashCode());
    }
}

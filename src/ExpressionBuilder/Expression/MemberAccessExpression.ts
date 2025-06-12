import { GenericType, IObjectType, StringKeyOf } from "../../Common/Type";
import { columnMetaKey, relationMetaKey } from "../../Decorator/DecoratorKey";
import { hashCode, resolveClone } from "../../Helper/Util";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { IExpression } from "./IExpression";
import { IMemberOperatorExpression } from "./IMemberOperatorExpression";

export class MemberAccessExpression<TE, K extends StringKeyOf<TE>, T = TE[K]> implements IMemberOperatorExpression<TE, T> {
    public get type() {
        if (!this._type) {
            if (this.objectOperand.type) {
                const objectType = this.objectOperand.type as IObjectType<TE>;
                const columnMeta = Reflect.getOwnMetadata(columnMetaKey, objectType, this.memberName) as ColumnMetaData;
                const relationMeta = Reflect.getOwnMetadata(relationMetaKey, objectType, this.memberName) as RelationMetaData<TE>;
                if (columnMeta) {
                    this._type = columnMeta.type;
                }
                else if (relationMeta) {
                    if (relationMeta.relationType === "one") {
                        this._type = relationMeta.target.type;
                    }
                    else {
                        this._type = Array;
                        this.itemType = relationMeta.target.type;
                    }
                }
                else {
                    let memberValue = (objectType.prototype as TE)[this.memberName];
                    if (!memberValue) {
                        try {
                            const objectInstance = new objectType();
                            memberValue = objectInstance[this.memberName];
                        } catch { /* ignoring error */ }
                    }
                    if (memberValue) {
                        this._type = (memberValue.constructor as GenericType<T>);
                    }
                }
            }
        }
        return this._type;
    }
    public set type(value) {
        this._type = value;
    }
    constructor(public objectOperand: IExpression<TE>, public memberName: K, type?: GenericType<T>) {
        this._type = type;
    }
    public itemType?: GenericType;
    private _type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const objectOperand = resolveClone(this.objectOperand, replaceMap);
        const clone = new MemberAccessExpression<TE, K, T>(objectOperand, this.memberName);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode("." + this.memberName, this.objectOperand.hashCode());
    }
    public toString(): string {
        let result = this.objectOperand.toString();
        result += "." + this.memberName;
        return result;
    }
}

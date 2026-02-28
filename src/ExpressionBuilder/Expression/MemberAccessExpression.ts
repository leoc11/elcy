import { ElementType, GenericType, IObjectType, StringKeyOf, ValueType } from "../../Common/Type";
import { hashCode, resolveClone } from "../../Helper/Util";
import { getColumnMetadata, getRelationMetadata } from "../../MetaData/MetaDataMapper";
import { IExpression } from "./IExpression";
import { IMemberOperatorExpression } from "./IMemberOperatorExpression";

export class MemberAccessExpression<TE extends object, K extends StringKeyOf<TE>, T extends TE[K] = TE[K]> implements IMemberOperatorExpression<TE, T> {
    public get type() {
        if (!this._type) {
            if (this.objectOperand.type) {
                const objectType = this.objectOperand.type as IObjectType<TE>;
                const columnMeta = getColumnMetadata<TE, K, T & ValueType>(objectType, this.memberName);
                const relationMeta = getRelationMetadata<TE, K, T & Object>(objectType, this.memberName);
                if (columnMeta) {
                    this._type = columnMeta.type;
                }
                else if (relationMeta) {
                    if (relationMeta.relationType === "one") {
                        this._type = relationMeta.target.type;
                    }
                    else {
                        this._type = Array as IObjectType<ElementType<T>[]> as IObjectType<T>;
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
    public isOptional?: boolean;
    private _type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const objectOperand = resolveClone(this.objectOperand, replaceMap);
        const clone = new MemberAccessExpression<TE, K, T>(objectOperand, this.memberName);
        clone.isOptional = this.isOptional;
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode(`${this.isOptional ? "?" : ""}.${this.memberName}`, this.objectOperand.hashCode());
    }
    public toString(): string {
        return `${this.objectOperand}${this.isOptional ? "?" : ""}.${this.memberName}`;
    }
}

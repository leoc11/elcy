import { columnMetaKey, relationMetaKey } from "../../Decorator/DecoratorKey";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { IMemberOperatorExpression } from "./IMemberOperatorExpression";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { getClone } from "../../Helper/Util";
export class MemberAccessExpression<T, K extends keyof T> extends ExpressionBase<T[K]> implements IMemberOperatorExpression<T> {
    public static create<T, K extends keyof T>(objectOperand: IExpression<T>, member: K) {
        const result = new MemberAccessExpression(objectOperand, member);
        if (objectOperand instanceof ValueExpression)
            return ValueExpression.create<T[K]>(result);

        return result;
    }
    constructor(public objectOperand: IExpression<T>, public memberName: K) {
        super();
    }
    private _type: any;
    public get type() {
        if (!this._type) {
            if (this.objectOperand.type) {
                const columnMeta: ColumnMetaData = Reflect.getOwnMetadata(columnMetaKey, this.objectOperand.type, this.memberName);
                const relationMeta: RelationMetaData<T, any> = Reflect.getOwnMetadata(relationMetaKey, this.objectOperand.type, this.memberName);
                if (columnMeta)
                    this._type = columnMeta.type;
                else if (relationMeta) {
                    if (relationMeta.relationType === "one")
                        this._type = relationMeta.target.type;
                    else {
                        this._type = Array as any;
                        this.itemType = relationMeta.target.type;
                    }
                }
                else {
                    const val = this.objectOperand.type.prototype[this.memberName];
                    if (val)
                        this._type = val.constructor;
                }
            }
        }
        return this._type;
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        let result = this.objectOperand.toString();
        result += "." + this.memberName;
        return result;
    }
    public execute(transformer?: ExpressionTransformer) {
        return (this.objectOperand.execute(transformer) as any)[this.memberName];
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const objectOperand = getClone(this.objectOperand, replaceMap);
        const clone = new MemberAccessExpression(objectOperand, this.memberName);
        replaceMap.set(this, clone);
        return clone;
    }
}

import { columnMetaKey, relationMetaKey } from "../../Decorator/DecoratorKey";
import { ColumnMetaData } from "../../MetaData/index";
import { IRelationMetaData } from "../../MetaData/Interface/index";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { RelationType } from "../../Common/Type";
export class MemberAccessExpression<TType, KProp extends keyof TType> extends ExpressionBase<TType[KProp]> {
    public static create<TType, KProp extends keyof TType>(objectOperand: IExpression<TType>, member: KProp | ExpressionBase<KProp>) {
        const result = new MemberAccessExpression(objectOperand, member);
        if (objectOperand instanceof ValueExpression && (member instanceof ValueExpression || !(member instanceof ExpressionBase)))
            return ValueExpression.create<TType[KProp]>(result);

        return result;
    }
    constructor(public objectOperand: IExpression<TType>, public memberName: KProp | ExpressionBase<KProp>) {
        super();
        if (!(memberName instanceof ExpressionBase) && objectOperand.type) {
            const columnMeta: ColumnMetaData = Reflect.getOwnMetadata(columnMetaKey, objectOperand.type, memberName);
            if (columnMeta)
                this.type = columnMeta.type;
            else {
                const relationMeta: IRelationMetaData<TType, any> = Reflect.getOwnMetadata(relationMetaKey, objectOperand.type, memberName);
                if (relationMeta) {
                    if (relationMeta.relationType === RelationType.OneToOne)
                        this.type = relationMeta.targetType;
                    else {
                        this.type = Array as any;
                        this.objectType = relationMeta.targetType;
                    }
                }
            }
        }
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        let result = this.objectOperand.toString();
        if (this.memberName instanceof ExpressionBase)
            result += "[" + this.memberName.toString() + "]";
        else
            result += "." + this.memberName;
        return result;
    }
    public execute(transformer?: ExpressionTransformer) {
        let member = "";
        if (this.memberName instanceof ExpressionBase)
            member = this.memberName.execute(transformer);
        else
            member = this.memberName;

        return (this.objectOperand.execute(transformer) as any)[member];
    }
    public clone() {
        return new MemberAccessExpression(this.objectOperand, this.memberName);
    }
}

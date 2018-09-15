import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";
import { MethodCallExpression } from "./MethodCallExpression";
export class AssignmentExpression extends ExpressionBase implements IBinaryOperatorExpression {
    public static create(leftOperand: ParameterExpression, rightOperand: IExpression) {
        return new AssignmentExpression(leftOperand, rightOperand);
    }
    constructor(public leftOperand: ParameterExpression, public rightOperand: IExpression) {
        super(leftOperand.type);
        if (leftOperand.type === String) {
            this.rightOperand = this.convertToStringOperand(rightOperand) as any;
        }
    }
    public convertToStringOperand(operand: IExpression): IExpression<string> {
        if (operand.type !== String) {
            operand = new MethodCallExpression(operand, "toString", []);
        }
        return operand as any;
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.leftOperand.toString() + " = " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        const value = this.rightOperand.execute(transformer);
        transformer.scopeParameters.remove(this.leftOperand.name);
        transformer.scopeParameters.add(this.leftOperand.name, value);
        return value;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = replaceMap.has(this.leftOperand) ? replaceMap.get(this.leftOperand) as ParameterExpression : this.leftOperand.clone(replaceMap);
        const right = replaceMap.has(this.rightOperand) ? replaceMap.get(this.rightOperand) : this.rightOperand.clone(replaceMap);
        return new AssignmentExpression(left, right);
    }
}

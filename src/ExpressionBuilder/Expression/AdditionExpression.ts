import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { MethodCallExpression } from "./index";

export class AdditionExpression<T extends number | string> extends ExpressionBase<T> implements IBinaryOperatorExpression {
    public static Create<TModel>(leftOperand: IExpression<TModel>, rightOperand: IExpression<TModel>): IExpression<TModel>;
    public static Create(leftOperand: IExpression, rightOperand: IExpression<string>): IExpression<string>;
    public static Create(leftOperand: IExpression<string>, rightOperand: IExpression): IExpression<string>;
    public static Create(leftOperand: IExpression<number>, rightOperand: IExpression): IExpression<number>;
    public static Create(leftOperand: IExpression, rightOperand: IExpression<number>): IExpression<number>;
    public static Create(leftOperand: IExpression, rightOperand: IExpression): IExpression {
        const result = new AdditionExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create(result);

        return result;
    }
    public leftOperand: IExpression<T>;
    public rightOperand: IExpression<T>;
    constructor(leftOperand: IExpression, rightOperand: IExpression) {
        super();
        if (leftOperand.type === String || rightOperand.type === String) {
            this.type = String as any;
            this.leftOperand = this.convertToStringOperand(leftOperand) as any;
            this.rightOperand = this.convertToStringOperand(rightOperand) as any;
        }
        else
            this.type = Number as any;
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

        return "(" + this.leftOperand.toString() + " + " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.leftOperand.execute(transformer) + this.rightOperand.execute(transformer);
    }
}

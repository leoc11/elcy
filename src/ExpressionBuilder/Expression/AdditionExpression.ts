import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";

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

    constructor(public leftOperand: IExpression, public rightOperand: IExpression) {
        super();
        if (this.leftOperand.type === String || this.rightOperand.type === String)
            this.type = String as any;
        else
            this.type = Number as any;
    }

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.leftOperand.toString(transformer) + " + " + this.rightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.leftOperand.execute(transformer) + this.rightOperand.execute(transformer);
    }
}

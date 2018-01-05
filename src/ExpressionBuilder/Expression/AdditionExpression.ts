import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";

export class AdditionExpression<T extends number | string> extends ExpressionBase<T> {
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

    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
        super();
        if (this.LeftOperand.type === String || this.RightOperand.type === String)
            this.type = String as any;
        else
            this.type = Number as any;
    }

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.LeftOperand.toString(transformer) + " + " + this.RightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.LeftOperand.execute(transformer) + this.RightOperand.execute(transformer);
    }
}

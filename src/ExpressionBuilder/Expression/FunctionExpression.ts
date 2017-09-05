import { IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";

export class FunctionExpression implements IExpression {
    public readonly Type: string;

    constructor(public Params: Array<ParameterExpression<any>>, public Body: IExpression) {
    }

    public ToString(): string {
        const params = [];
        for (const param of this.Params)
            params.push(param.ToString());

        return "(" + params.join(", ") + ") => {" + this.Body.ToString() + "}";
    }
    public Execute() {
        throw new Error("Method not implemented.");
    }

}

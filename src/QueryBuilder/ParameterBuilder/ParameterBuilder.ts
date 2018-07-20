import { ISqlParameterBuilderItem } from "./ISqlParameterBuilderItem";
import { ValueExpressionTransformer } from "../../ExpressionBuilder/ValueExpressionTransformer";

export class ParameterBuilder {
    constructor(protected readonly items: ISqlParameterBuilderItem[]) {

    }
    public build(params: { [key: string]: any }): { [key: string]: any } {
        const result: { [key: string]: any } = {};
        const tranformer = new ValueExpressionTransformer(params);
        for (const param of this.items) {
            const value = param.valueGetter.execute(tranformer);
            result[param.name] = value;
        }
        return result;
    }
}

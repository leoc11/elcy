import { ISqlParameterBuilderItem } from "./ISqlParameterBuilderItem";
import { ValueExpressionTransformer } from "../../ExpressionBuilder/ValueExpressionTransformer";

export class ParameterBuilder {
    constructor(protected readonly items: ISqlParameterBuilderItem[]) {

    }
    public getSqlParameters(params: { [key: string]: any }): Map<string, any> {
        const result = new Map<string, any>();
        const tranformer = new ValueExpressionTransformer(params);
        for (const param of this.items) {
            const value = param.valueGetter.execute(tranformer);
            result.set(param.name, value);
        }
        return result;
    }
}

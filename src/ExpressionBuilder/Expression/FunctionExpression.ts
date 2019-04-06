import { GenericType } from "../../Common/Type";
import { IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";
import { ObjectValueExpression } from "./ObjectValueExpression";
import { resolveClone } from "../../Helper/Util";

export class FunctionExpression<T = any> implements IExpression<T> {
    public type: GenericType<T>;
    public itemType?: GenericType;
    // TODO: type must always specified
    constructor(public body: IExpression<T>, public params: Array<ParameterExpression>, type?: GenericType<T>) {
        this.type = type;
    }

    public toString(): string {
        const params = [];
        for (const param of this.params)
            params.push(param.toString());

        if (this.body instanceof ObjectValueExpression)
            return "(" + params.join(", ") + ") => (" + this.body.toString() + ")";
        return "(" + params.join(", ") + ") => " + this.body.toString();
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const params = this.params.select(o => resolveClone(o, replaceMap)).toArray();
        const body = resolveClone(this.body, replaceMap);
        const clone = new FunctionExpression(body, params);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return this.body.hashCode();
    }
}

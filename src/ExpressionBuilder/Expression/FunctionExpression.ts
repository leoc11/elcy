import { GenericType } from "../../Common/Type";
import { resolveClone } from "../../Helper/Util";
import { IExpression } from "./IExpression";
import { ObjectValueExpression } from "./ObjectValueExpression";
import { ParameterExpression } from "./ParameterExpression";

const FunctionTypeConstructor: () => ((...param: any[]) => any) = () => (() => {});
export class FunctionExpression<T = unknown, K = unknown> implements IExpression<(...param: K[]) => T> {
    // TODO: type must always specified
    constructor(public body: IExpression<T>, public params: ParameterExpression<K>[], type?: GenericType<T>) {
        this.returnType = type;
        this.type = FunctionTypeConstructor;
    }
    public returnType?: GenericType<T>;
    public type: GenericType<(...param: K[]) => T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const params = this.params.map((o) => resolveClone(o, replaceMap));
        const body = resolveClone(this.body, replaceMap);
        const clone = new FunctionExpression(body, params);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return this.body.hashCode();
    }

    public toString(): string {
        const params = [];
        for (const param of this.params) {
            params.push(param.toString());
        }

        if (this.body instanceof ObjectValueExpression) {
            return "(" + params.join(", ") + ") => (" + this.body.toString() + ")";
        }
        return "(" + params.join(", ") + ") => " + this.body.toString();
    }
}

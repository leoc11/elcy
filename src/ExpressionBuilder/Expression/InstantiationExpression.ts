import { IObjectType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class InstantiationExpression<T> extends ExpressionBase<T> {
    public static create<T>(type: IObjectType<T> | IExpression<IObjectType<T>>, params: IExpression[]) {
        let typeExp: IExpression<IObjectType<T>>;
        if (type instanceof ExpressionBase)
            typeExp = type as IExpression<IObjectType<T>>;
        else
            typeExp = new ValueExpression(type as IObjectType<T>);

        const result = new InstantiationExpression(typeExp, params);
        if (typeExp instanceof ValueExpression && params.every((param) => param instanceof ValueExpression)) {
            return ValueExpression.create(result);
        }

        return result;
    }
    constructor(public typeOperand: IExpression<IObjectType<T>>, public params: IExpression[]) {
        super();
    }
    public get type() {
        try {
            return this.typeOperand.execute();
        }
        catch (e) { return null; }
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const paramStr = [];
        for (const param of this.params)
            paramStr.push(param.toString());
        return "new " + this.typeOperand.toString() + "(" + paramStr.join(", ") + ")";
    }
    public execute(transformer?: ExpressionTransformer) {
        const params = [];
        for (const param of this.params)
            params.push(param.execute(transformer));
        const type = this.typeOperand.execute(transformer);
        return new type(...params) as any;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const typeOperand = replaceMap.has(this.typeOperand) ? replaceMap.get(this.typeOperand) as IExpression<IObjectType<T>> : this.typeOperand.clone(replaceMap);
        const params = this.params.select(o => replaceMap.has(o) ? replaceMap.get(o) : o.clone(replaceMap)).toArray();
        return new InstantiationExpression(typeOperand, params);
    }
}

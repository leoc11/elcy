import { IObjectType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";

export class ObjectValueExpression<T> extends ExpressionBase<T> {
    public static create<TType extends { [Key: string]: IExpression }>(objectValue: TType) {
        const result = new ObjectValueExpression(objectValue);
        let isAllValue = true;
        for (const prop in objectValue) {
            if (!(objectValue[prop] instanceof ValueExpression)) {
                isAllValue = false;
                break;
            }
        }
        if (isAllValue)
            return ValueExpression.create<TType>(objectValue);

        return result;
    }
    public object: { [key in keyof T]?: IExpression };
    public type: IObjectType<T>;
    constructor(objectValue: { [key in keyof T]?: IExpression }, type?: IObjectType<T>) {
        super();
        this.object = objectValue;
        this.type = type ? type : objectValue.constructor as IObjectType<T>;
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const itemString = [];
        for (const item in this.object)
            itemString.push(item + ": " + this.object[item].toString());
        return "{" + itemString.join(", ") + "}";
    }
    public execute(transformer: ExpressionTransformer): T {
        const objectValue: T = {} as any;
        for (const prop in this.object)
            objectValue[prop] = this.object[prop].execute(transformer);
        return objectValue;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const obj: { [key in keyof T]?: IExpression } = {};
        for (const prop in this.object) {
            const propEx = this.object[prop];
            obj[prop] = replaceMap.has(propEx) ? replaceMap.get(propEx) : propEx.clone(replaceMap);
        }
        return new ObjectValueExpression(obj, this.type);
    }
}

import { GenericType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
export interface IExpression<T = any> {
    type: GenericType<T>;
    itemType?: GenericType<any>;
    toString(transformer?: ExpressionTransformer): string;
    execute(transformer?: ExpressionTransformer): T;
    clone(replaceMap?: Map<IExpression, IExpression>): IExpression<T>;
    hashCode(): number;
}

// export abstract class ExpressionBase<T = any> implements IExpression<T> {
//     public type: GenericType<T>;
//     public itemType: GenericType<any>;
//     constructor(type?: GenericType<T>) {
//         if (type)
//             this.type = type;
//     }
//     public toString(transformer?: ExpressionTransformer): string {
//         if (transformer)
//             return transformer.getExpressionString(this);
//         return "";
//     }
//     public execute(transformer?: ExpressionTransformer): T {
//         if ((this.type as IObjectType<T>).prototype)
//             return new (this.type as IObjectType<T>)();
//         return (this.type as () => T)();
//     }
//     public abstract clone(replaceMap?: Map<IExpression, IExpression>): ExpressionBase<T>;
//     public hashCode() {
//         return 1;
//     }
// }

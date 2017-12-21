import { ExpressionBase, IExpression } from "./Expression/IExpression";

export class ExpressionFactory {
    // tslint:disable-next-line:variable-name
    public GetExpressionFactory<T, K>(_fn: (source?: T) => K): () => IExpression<K> {
        return () => new ExpressionBase<K>();
    }
}

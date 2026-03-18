import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { StringKeyOf, ValueType } from "../../Common/Type";
import { ClassAccessor, ClassAccessorDecorator } from "../Type";
import { ExpressionBuilder } from "src/ExpressionBuilder/ExpressionBuilder";
import { ComputedColumnMetaData } from "src/MetaData/ComputedColumnMetaData";
import { setColumnMetadata } from "src/MetaData/MetaDataMapper";

// TODO: types: Persisted, Virtual, Query
export function ComputedColumn<TE extends object = object, T extends ValueType = ValueType>(fn: (o: TE) => T): ClassAccessorDecorator<TE, T> {
    return (accessor: ClassAccessor<T>, context: ClassAccessorDecoratorContext<TE, T>) => {
        let columnHandlers = context.metadata.columns as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(columnHandlers)) {
            context.metadata.columns = columnHandlers = [];
        }
        columnHandlers.push((entityMeta) => {
            if (entityMeta.columns.some(o => o.propertyName === context.name)) {
                throw new Error(`Cannot re-declare column: ${String(context.name)}`);
            }

            const fnExp = ExpressionBuilder.parse(fn, [entityMeta.type]);
            const propertyKey = context.name as StringKeyOf<TE>;
            const column = new ComputedColumnMetaData(entityMeta, fnExp, propertyKey);
            entityMeta.columns.push(column);
            setColumnMetadata(entityMeta.type, propertyKey, column as any);
        });

        return {
            get(this: TE) {
                let value = accessor.get.call(this);
                if (typeof value === "undefined") {
                    value = fn(this);
                    accessor.set.call(this, value);
                }

                return value;
            }
        }
    };
}

import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { IRowVersionColumnOption } from "../Option/IRowVersionColumnOption";
import { Column } from "./Column";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";

export function RowVersionColumn<TE extends object, T extends Uint8Array>(option?: IRowVersionColumnOption): ClassPropertyDecorator<TE, Uint8Array>;
export function RowVersionColumn<TE extends object, T extends Uint8Array>(name?: string, defaultValue?: () => T): ClassPropertyDecorator<TE, Uint8Array>;
export function RowVersionColumn<TE extends object, T extends Uint8Array>(optionOrName?: IRowVersionColumnOption | string, defaultValue?: () => T): ClassPropertyDecorator<TE, Uint8Array> {
    let option: IRowVersionColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined") {
            option.columnName = optionOrName as string;
        }
        if (typeof defaultValue !== "undefined") {
            option.default = defaultValue;
        }
    }

    const columnDecorator = Column<TE, Uint8Array>(Uint8Array, RowVersionColumnMetaData, option);
    return (target: undefined | ClassAccessor<Uint8Array>, context: ClassFieldDecoratorContext<TE, Uint8Array> | ClassAccessorDecoratorContext<TE, Uint8Array>) => {
        let columnHandlers = context.metadata.columns as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(columnHandlers)) {
            context.metadata.columns = columnHandlers = [];
        }
        columnDecorator(target as any, context as any);
        columnHandlers.push((entityMeta) => {
            const column = entityMeta.columns.find(o => o.propertyName === context.name) as RowVersionColumnMetaData<TE>;
            if (column === null) {
                throw new Error(`column not found`);
            }
            entityMeta.versionColumn = column;
            if (!entityMeta.concurrencyMode) {
                entityMeta.concurrencyMode = "OPTIMISTIC VERSION";
            }
        });
    };
}

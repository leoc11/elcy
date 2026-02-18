import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { IRowVersionColumnOption } from "../Option/IRowVersionColumnOption";
import { Column } from "./Column";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";

export function RowVersionColumn<TE extends object, T extends Uint8Array>(option?: IRowVersionColumnOption): ClassPropertyDecorator<TE, T>;
export function RowVersionColumn<TE extends object, T extends Uint8Array>(optionOrName?: IRowVersionColumnOption | string, defaultValue?: () => string): ClassPropertyDecorator<TE, T> {
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
    
    const columnDecorator = Column<TE, T>(RowVersionColumnMetaData as any, option);
    return (target: undefined | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T> | ClassAccessorDecoratorContext<TE, T>) => {
        columnDecorator(target as any, context as any);
        context.metadata.versionColumn = context.name;
    };
}

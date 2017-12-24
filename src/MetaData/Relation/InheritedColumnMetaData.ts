import { ColumnType } from "../../Common/ColumnType";
import { genericType } from "../../Common/Type";
import { IColumnOption } from "../../Decorator/Option";
import { ColumnMetaData } from "../../MetaData";

export class InheritedColumnMetaData<P, T> implements IColumnOption<T> {
    public propertyName: string;
    public parentType: genericType<P>;
    public get name(): string {
        return this.columnMetaData.name;
    }
    public get nullable(): boolean {
        return this.columnMetaData.nullable;
    }
    public get default(): T | undefined {
        return this.columnMetaData.default;
    }
    public get description(): string {
        return this.columnMetaData.description;
    }
    public get columnType(): ColumnType {
        return this.columnMetaData.columnType;
    }
    public get type(): genericType<T> {
        return this.columnMetaData.type;
    }
    public get collation(): string {
        return this.columnMetaData.collation;
    }
    public get charset(): string {
        return this.columnMetaData.charset;
    }
    private columnMetaData: ColumnMetaData<T>;
    // tslint:disable-next-line:no-shadowed-variable
    constructor(parentMetaData: ColumnMetaData<T>, parentType?: genericType<P>, propertyName?: string) {
        if (parentMetaData instanceof InheritedColumnMetaData) {
            this.columnMetaData = parentMetaData.columnMetaData;
            this.parentType = parentMetaData.parentType;
            this.propertyName = parentMetaData.propertyName;
        }
        else if (parentMetaData instanceof ColumnMetaData) {
            this.columnMetaData = parentMetaData;
            this.parentType = parentType as genericType<P>;
            this.propertyName = propertyName as string;
        }
    }

    /**
     * Copy
     */
    // tslint:disable-next-line:no-empty
    public Copy(columnMeta: IColumnOption<any>) {
        if (columnMeta instanceof InheritedColumnMetaData) {
            this.columnMetaData = columnMeta.columnMetaData;
            this.parentType = columnMeta.parentType;
            this.propertyName = columnMeta.propertyName;
        }
        else if (columnMeta instanceof ColumnMetaData) {
            this.columnMetaData = columnMeta;
        }
    }
}

import "reflect-metadata";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/index";
import { entityMetaKey, columnMetaKey } from "../DecoratorKey";
import { ColumnMetaData } from "../../MetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IObjectType } from "../../Common/Type";

export function PrimaryKey(): PropertyDecorator {
    return <TE>(target: TE, propertyKey: keyof TE /* | symbol */) => {
        let entityMetaData: IEntityMetaData<TE> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (!entityMetaData) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as IObjectType<TE>);
            Reflect.defineMetadata(entityMetaKey, entityMetaData, target.constructor);
        }

        if (!entityMetaData.primaryKeys.any(o => o.propertyName === propertyKey)) {
            let columnMeta: IColumnMetaData<TE> = Reflect.getOwnMetadata(columnMetaKey, target.constructor, propertyKey);
            if (!columnMeta) {
                columnMeta = new ColumnMetaData<TE, any>();
                columnMeta.propertyName = propertyKey;
            }
            entityMetaData.primaryKeys.push(columnMeta);
        }
    };
}

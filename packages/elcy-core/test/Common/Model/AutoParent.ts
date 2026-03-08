import { BooleanColumn } from "../../../src/Decorator/Column/BooleanColumn";
import { CreatedDateColumn } from "../../../src/Decorator/Column/CreatedDateColumn";
import { DeletedColumn } from "../../../src/Decorator/Column/DeletedColumn";
import { IntegerColumn } from "../../../src/Decorator/Column/IntegerColumn";
import { ModifiedDateColumn } from "../../../src/Decorator/Column/ModifiedDateColumn";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { AfterDelete } from "../../../src/Decorator/EventHandler/AfterDelete";
import { AfterSave } from "../../../src/Decorator/EventHandler/AfterSave";
import { BeforeDelete } from "../../../src/Decorator/EventHandler/BeforeDelete";
import { BeforeSave } from "../../../src/Decorator/EventHandler/BeforeSave";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { ISaveEventParam } from "../../../src/MetaData/Interface/ISaveEventParam";
import { AutoDetail } from "./AutoDetail";

@Entity("AutoParent")
export class AutoParent {
    @PrimaryKey()
    @IntegerColumn({ columnType: "int", autoIncrement: true })
    public id: number;
    @StringColumn()
    public name: string;
    @BooleanColumn({ default: () => true })
    public isDefault: boolean;
    @DeletedColumn()
    public isDeleted: boolean;
    @CreatedDateColumn()
    public createdDate: Date;
    @ModifiedDateColumn()
    public modifiedDate: Date;

    @Relationship<AutoParent>("has", "many", AutoDetail || "AutoDetail", [(o) => o.id])
    public details: AutoDetail[];

    @BeforeSave<AutoParent>()
    public beforeSave(entity: AutoParent, param: ISaveEventParam) {
        // before save
    }

    @AfterSave<AutoParent>()
    public afterSave(entity: AutoParent, param: ISaveEventParam) {
        // after save
    }

    @BeforeDelete<AutoParent>()
    public beforeDelete(entity: AutoParent, param: ISaveEventParam) {
        // before save
    }

    @AfterDelete<AutoParent>()
    public afterDelete(entity: AutoParent, param: ISaveEventParam) {
        // after save
    }
}

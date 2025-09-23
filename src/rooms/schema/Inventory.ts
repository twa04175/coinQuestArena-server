import {MapSchema, Schema, type} from "@colyseus/schema";
import {DataManager} from "../../DataMananger";


/** 아이템 정의(마스터 데이터) */
export class Inventory extends Schema {
    //string = itemId, number = count
    @type({map: "number"}) items = new MapSchema<number>();

    constructor() {
        super();

        DataManager.instance.getAllItemKeys().forEach((key: string) => {
            if(key === 'RICE') {
                this.items.set(key, 100);
            }else {
                this.items.set(key, 0);
            }
        })
    }
}

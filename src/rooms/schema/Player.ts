import {Schema, type} from "@colyseus/schema";
import {Inventory} from "./Inventory";
import {Movement} from "./Movement";

export class Player extends Schema {
    @type("string") id: string;
    @type("string") name: string;   // 닉네임

    // 3) 위치/이동(서버 스냅샷에 필요)
    @type(Movement) movement: Movement = new Movement();
    @type(Inventory)  inventory: Inventory = new Inventory();

    constructor(name: string = "", sessionId: string = "") {
        super();
        this.id = sessionId;
        this.name = name;
    }
}

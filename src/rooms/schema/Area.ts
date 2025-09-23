import { Schema, type } from "@colyseus/schema";

export class Area extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
}

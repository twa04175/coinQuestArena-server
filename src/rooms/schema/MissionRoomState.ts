import {MapSchema, Schema, type } from "@colyseus/schema";
import {Player} from "./Player";
import {Field} from "./Feild";
import {PhysicsWorld} from "../../PhysicsWorld";

export class MissionRoomState extends Schema {
  @type("number") id: number;

  @type({ map: Player }) players = new MapSchema<Player>();
  @type(Field) field: Field = new Field();
  @type("number") tick: number = 0;

  constructor() {
    super();
  }
}

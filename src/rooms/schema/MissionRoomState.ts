import {MapSchema, Schema, type } from "@colyseus/schema";
import {Player} from "./Player";

export class MissionRoomState extends Schema {
  @type("number") id: number;

  @type({ map: Player }) players = new MapSchema<Player>();
  @type("number") width: number = 800;
  @type("number") height: number = 800;

  @type("number") tick: number = 0;

}

import { Room, Client } from "@colyseus/core";
import { MissionRoomState } from "./schema/MissionRoomState";
import {Player} from "./schema/Player";

export class MissionRoom extends Room<MissionRoomState> {
  maxClients = 20;
  state = new MissionRoomState();
  private static roomCounter = 0;

  private readonly tickRate = 20;
  private readonly dt = 1 / this.tickRate;

  onCreate (options: any) {
    MissionRoom.roomCounter++;
    this.state.id = MissionRoom.roomCounter;
    this.onMessage("moveInput", (client, data: { seq?: number; x: number; y: number }) => {

      const p = this.state.players.get(client.sessionId);
      if (!p) return;

      const mv = p.movement;
      const ix = Number(data?.x);
      const iy = Number(data?.y);
      if (!Number.isFinite(ix) || !Number.isFinite(iy)) return;

      const len = Math.hypot(ix, iy);
      if (len > 0.0001) {
        mv.dirX = ix / len;
        mv.dirY = iy / len;
      } else {
        mv.dirX = 0; mv.dirY = 0;
      }

      if (typeof data?.seq === "number") {
        mv.lastProcessedInput = data.seq;
      }

      mv.lastUpdateAt = Date.now();
    });

    this.setSimulationInterval(() => this.moveSimulation(), 1000 / this.tickRate);
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!", options);
    this.state.players.set(client.sessionId, new Player(options?.name??"", client.sessionId));
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  private moveSimulation() {
    const now = Date.now();
    const W = this.state.width, H = this.state.height;
    const halfW = W / 2, halfH = H / 2;

    this.state.tick++;

    this.state.players.forEach((p) => {
      const mv = p.movement;

      const speed = Math.min(mv.speed, mv.maxSpeed);
      const vx = mv.dirX * speed;
      const vy = mv.dirY * speed;

      mv.x += vx * this.dt;
      mv.y += vy * this.dt;

      // 중앙 기준 경계
      if (mv.x < -halfW) mv.x = -halfW;
      if (mv.x >  halfW) mv.x =  halfW;
      if (mv.y < -halfH) mv.y = -halfH;
      if (mv.y >  halfH) mv.y =  halfH;

      mv.tick = this.state.tick;
      mv.lastUpdateAt = now;
    });
  }
}

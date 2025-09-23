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
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const ix = Number(data?.x);
      const iy = Number(data?.y);
      if (!Number.isFinite(ix) || !Number.isFinite(iy)) return;

      // 정규화(대각 가속 방지)
      const len = Math.hypot(ix, iy);
      if (len > 0.0001) {
        player.dirX = ix / len;
        player.dirY = iy / len;
      } else {
        player.dirX = 0;
        player.dirY = 0;
      }

      if (typeof data?.seq === "number") {
        player.lastProcessedInput = data.seq;
      }

      player.lastUpdateAt = Date.now();
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
    const W = this.state.width;
    const H = this.state.height;

    const halfW = W / 2;
    const halfH = H / 2;

    this.state.tick++;

    this.state.players.forEach((p) => {
      const speed = Math.min(p.speed, p.maxSpeed);

      const vx = p.dirX * speed;
      const vy = p.dirY * speed;

      p.x += vx * this.dt;
      p.y += vy * this.dt;

      // --- 중앙 기준 경계 클램프 ---
      if (p.x < -halfW) p.x = -halfW;
      if (p.x > halfW)  p.x = halfW;
      if (p.y < -halfH) p.y = -halfH;
      if (p.y > halfH)  p.y = halfH;

      p.tick = this.state.tick;
      p.lastUpdateAt = now;
    });
  }
}

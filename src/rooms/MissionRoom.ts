import {Room, Client} from "@colyseus/core";
import {MissionRoomState} from "./schema/MissionRoomState";
import {Player} from "./schema/Player";
import {Collider, ColliderType} from "./schema/Prop";
import {PhysicsWorld} from "../PhysicsWorld";

export class MissionRoom extends Room<MissionRoomState> {
    maxClients = 20;
    state = new MissionRoomState();
    private static roomCounter = 0;
    private readonly tickRate = 20;
    private readonly dt = 1 / this.tickRate;
    private physicsWorld: PhysicsWorld;

    onCreate(options: any) {
        MissionRoom.roomCounter++;
        this.state.id = MissionRoom.roomCounter;
        this.physicsWorld = new PhysicsWorld();

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
                mv.dirX = 0;
                mv.dirY = 0;
            }

            if (typeof data?.seq === "number") {
                mv.lastProcessedInput = data.seq;
            }

            mv.lastUpdateAt = Date.now();
        });
        this.onMessage("chatInput", (client, data: { msg: string }) => {
            const p = this.state.players.get(client.sessionId);
            if (!p) return;

            const msg = (data?.msg ?? "").substring(0, 100).trim();
            console.log("chatInput", client.sessionId, msg);
            p.msg = msg;
            p.lastMsg = Date.now();
        })

        this.physicsWorld.init(this.tickRate, this.state);
        this.setSimulationInterval(() => {
            this.physicsWorld.simulate()

            if(process.env.NODE_ENV !== 'production') {
                let newPlayerPos:Collider[] = [];
                this.state.field.colliders.forEach(collider => {
                    newPlayerPos.push(collider);
                })

                this.state.players.forEach((p)=>{
                    newPlayerPos.push(this.physicsWorld.getPlayerPhysicsState(p.id, p.movement));
                })

                this.clients.forEach((client: Client) => {
                    client.send('debug-colliders',{
                        colliders: newPlayerPos
                    })
                })
            }
        }, 1000 / this.tickRate);
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!", options);
        this.state.players.set(client.sessionId, new Player(options?.name ?? "", options?.color??"" , client.sessionId));
        client.send('map', {tiles:this.state.field.tiles})
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");

        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}

import config from "@colyseus/tools";
// import { monitor } from "@colyseus/monitor";
import cors from 'cors';
import path from "path";
import express from "express";


/**
 * Import your Room files
 */
import { MissionRoom } from "./rooms/MissionRoom";

const PUBLIC_DIR = path.resolve(__dirname, "../public"); // 정적 파일 위치 (index.html 포함)

export default config({

    initializeGameServer: (gameServer) => {
        gameServer.define('mission_room', MissionRoom);
    },

    initializeExpress: (app) => {
        app.use(
            cors({
                origin: [
                    'http://localhost:7456',
                    'https://cqa.hustlerholdem.com',
                ],
            }),
        );

        /**
         * Bind your custom express routes here:
         * Read more: https://expressjs.com/en/starter/basic-routing.html
         */
        app.get("/hello_world", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        app.use(express.static(PUBLIC_DIR, {
            index: false,                 // index는 아래 핸들러에서 수동 제공
            maxAge: "7d",                 // 캐시 전략(원하면 수정)
            setHeaders: (res, filePath) => {
                // 해시 파일은 장기 캐시
                if (/\.[a-f0-9]{8,}\./i.test(filePath)) {
                    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
                }
            }
        }));

        // ② 루트(/) → index.html 반환
        app.get("/", (_req, res) => {
            res.sendFile(path.join(PUBLIC_DIR, "index.html"));
        });

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        // if (process.env.NODE_ENV !== "production") {
        //     app.use("/", playground());
        // }

        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        // app.use("/monitor", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});

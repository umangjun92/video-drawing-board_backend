import express from "express";
import HTTP from "http";
import socket from "socket.io";
import { connectToDB } from "./utils/db";
import { urlParams } from "./utils/constants";
import { getOrCreateRoom, getRoomDetails, addRoom } from "./controllers/room.controller";
import { RoomModel } from "./models/room.model";

var app = express();
// var http = new HTTP.Server(app);
var PORT = process.env.PORT || 8000;

// app.use(express.static(`${__dirname}/client`));

app.get("/", (req, res) => {
    console.log("Get request to Homepage");
    res.send("Hiii sent by server...");
});

app.get(`/:${urlParams.ROOM_ID}`, getRoomDetails);
app.post(`/:${urlParams.ROOM_ID}`, addRoom);

// http.listen(PORT, function () {
//     console.log(`Server Started on PORT: ${PORT}`);
// });

interface Room {
    host: string;
    users: string[];
    roomId: string;
    videoUrl: string;
    videoPos: number;
    drawColor: string;
}

(async () => {
    console.log("connecting to db");
    const db = await connectToDB();
    const server = app.listen(PORT, () => {
        console.log(`server started on localhost:${PORT}`);
    });
    const io = socket(server);
    let roomHostMap = {};

    //Realtime message sending socket part
    io.on("connection", function (socket) {
        let currRoomId: string;
        socket.emit("connected", socket.id);
        //On getting drawing from request emit it to all users
        socket.on("dummy", (data) => {
            console.log("dummy data on disconnect", data);
        });
        socket.on("disconnect", async () => {
            console.log(`Disconnected: ${socket.id}`);
            const updatedUsers = Object.keys(io?.sockets?.adapter.rooms[currRoomId]?.sockets || {});
            // io.clients().sockets[roomHostMap[currRoomId]].emit("askRoomInfo");

            if (roomHostMap[currRoomId] === socket.id && updatedUsers?.length > 0) {
                roomHostMap[currRoomId] = updatedUsers[0];
            }
            if (updatedUsers.length === 0) {
                delete roomHostMap[currRoomId];
            }
            io.to(currRoomId).emit("roomUpdated", {
                host: roomHostMap[currRoomId],
                users: updatedUsers
            });
            // let room = await RoomModel.findOne({ users: socket.id });
            // // console.log("leaving room ", room);
            // if (room) {
            //     room.users = room.users?.filter((user) => user !== socket.id);
            //     if (socket.id === room.host && room.users && room.users.length > 0) {
            //         room.host = room.users[Math.floor(Math.random() * room.users.length)];
            //     }
            //     // io.to(room?.roomId).emit("roomUpdated", room);
            //     await RoomModel.findOneAndUpdate({ roomId: room.id }, room);
            // }
        });

        socket.on("roomInfoReceived", (roomInfo: Room) => {
            console.log("roomInfoReceived", roomInfo);
            // console.log("inside roomInfoReceived hots map", roomHostMap);
            // console.log("sending update room ", {
            //     // ...roomInfo,
            //     // host: roomHostMap[roomInfo.roomId],
            //     users: Object.keys(io.sockets.adapter.rooms[roomInfo.roomId].sockets)
            // });
            roomInfo &&
                io.to(roomInfo.roomId).emit("roomUpdated", {
                    ...roomInfo,
                    host: roomHostMap[roomInfo.roomId],
                    users: Object.keys(io.sockets.adapter.rooms[roomInfo.roomId].sockets)
                });
        });

        socket.on("join", async (roomId: string, _roomInfo: any) => {
            currRoomId = roomId;
            // check if host exists for this room
            socket.join(roomId);
            console.log(`Socket ${socket.id} joining ${roomId}`, (socket as any).dummy);
            if (!roomHostMap[roomId] || !io.clients().sockets[roomHostMap[roomId]]) {
                roomHostMap[roomId] = socket.id;
            }
            // console.log("inside join hots map", roomHostMap);
            // send upd
            // socket.emit("roomUpdated", { roomId, host: roomHostMap[roomId], users: [..._roomInfo.users, socket.id] } as Room);

            // ask host client for room Info
            io.clients().sockets[roomHostMap[roomId]].emit("askRoomInfo");
            // console.log("clinets", io.clients().sockets);

            // let room = (await RoomModel.findOne({ roomId })) as any;
            // if (!room) {
            //     const host = socket.id;
            //     room = await RoomModel.create({ roomId, users: [host], host });
            // } else {
            //     room.users?.push(socket.id);
            //     // console.log("joined room  ", roomId, room);
            //     await RoomModel.findOneAndUpdate({ roomId }, room);
            // }
        });
        socket.on("leave", async (roomId: string) => {
            console.log(`Socket ${socket.id} left ${roomId}`);
            socket.leave(roomId);
            let room = await RoomModel.findOne({ roomId });
            if (room) {
                if (socket.id === room.host && room.users && room.users.length > 0) {
                    room.host = room.users[Math.floor(Math.random() * 5)];
                }
                room.users = room.users?.filter((user) => user !== socket.id);
                await RoomModel.findOneAndUpdate({ roomId }, room);
            }

            // io.to(roomId).emit("roomUpdated", room);
        });
        socket.on("chat", (data) => {
            const { message, room } = data;
            console.log(`msg: ${message}, room: ${room}`);
            io.to(room).emit("chat", message);
        });
        socket.on("startDrawing", ({ roomId, xPos, yPos }: any) => {
            io.to(roomId).emit("startDrawing", { xPos, yPos });
        });
        socket.on("drawing", ({ roomId, xPos, yPos }: any) => {
            io.to(roomId).emit("drawing", { xPos, yPos });
        });
        socket.on("finishDrawing", ({ roomId }: any) => {
            io.to(roomId).emit("finishDrawing");
        });
    });
})();

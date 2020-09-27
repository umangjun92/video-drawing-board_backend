import { CustomError, ResponseObj, AppRequestHandler } from "../utils/custom-types";
import { RoomModel } from "../models/room.model";

export const addRoom: AppRequestHandler = async (req, res) => {
    try {
        const { roomId } = req.params;
        const newRoom = await RoomModel.create({ roomId, users: [req.body.host], ...req.body });
        res.status(201).json(new ResponseObj(newRoom, "SUCCESS"));
    } catch (err) {
        console.log("Error while adding room >> ", err);
    }
};

export const getRoomDetails: AppRequestHandler = async (req, res) => {
    try {
        const { roomId } = req.params;
        const roomDetails = await RoomModel.findOne({ roomId });
        console.log("room details", roomDetails);
        if (roomDetails) {
            res.status(200).json(new ResponseObj(roomDetails, "SUCCESS"));
        } else {
            throw new CustomError(404, "NOT_FOUND", "No Room found with this ID");
        }
    } catch (err) {
        res.status(err.status).json(err);
        console.log("Error while getting room details >> ", err);
    }
};

export const updateRoomDetails: AppRequestHandler = async (req, res) => {
    try {
        const { roomId } = req.params;
        const updatedRoom = RoomModel.findOneAndUpdate({ roomId }, req.body);
        res.status(201).json(new ResponseObj(updatedRoom, "SUCCESS"));
    } catch (e) {
        res.status(e.status).json(e);
        console.log("Error while updating room details >> ", e);
    }
};

export const getOrCreateRoom: AppRequestHandler = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const roomDetails = await getRoomDetails(req, res, next);
        if (!roomDetails) {
            await addRoom(req, res, next);
        }
    } catch (err) {
        res.status(err.status).send(err);
        console.log("Error while getting room details >> ", err);
    }
};

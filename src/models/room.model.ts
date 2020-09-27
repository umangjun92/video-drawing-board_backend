import { prop, Typegoose } from "typegoose";

// class VideoInfo extends Typegoose {
//     @prop({required: true}) url!: string;
//     @prop({ required})
// }

class Room extends Typegoose {
    @prop({ required: true, unique: true }) roomId!: string;
    @prop({ required: true }) host!: string;
    @prop() users?: string[];
    @prop({ default: "video" }) mode?: "video" | "whiteboard" = "video";
    @prop() videoUrl?: string;
    // @prop()
}

export const RoomModel = new Room().getModelForClass(Room);

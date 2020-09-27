import mongoose from "mongoose";

import { MONGODB_URL } from "../config/db.config";

export async function connectToDB() {
    return await mongoose
        .connect(MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: true,
            useCreateIndex: true
        })
        .catch((e) => console.log(e));
}

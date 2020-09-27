import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { urlParams } from "./constants";

export interface ExtendedParamsDictionary extends ParamsDictionary {
    [urlParams.ROOM_ID]: string;
}

export type AppRequestHandler = RequestHandler<ExtendedParamsDictionary>;

type ResMessageType = "SUCCESS";

export class ResponseObj<T> {
    data?: T;
    message?: ResMessageType;

    constructor(data?: T, message?: ResMessageType) {
        message = message || "SUCCESS";
        if (this.data) {
            this.data = data;
        }
    }
}

type ErrCodeType = "SERVER_ERROR" | "NOT_FOUND";

export class CustomError {
    status: number;
    code: ErrCodeType;
    message: string;

    constructor(status: number, code: ErrCodeType, message: string) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../src/database");
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('[seed] : seeding started');
        const db = yield database_1.connectDatabase();
        console.log('[seed] : connected to database');
        const listings = (yield db.listings.find({}).toArray()).length > 0;
        const bookings = (yield db.bookings.find({}).toArray()).length > 0;
        const users = (yield db.users.find({}).toArray()).length > 0;
        listings && (yield db.listings.drop());
        users && (yield db.users.drop());
        bookings && (yield db.bookings.drop());
        console.log('[seed] : seeding successful');
        process.exit();
    }
    catch (error) {
        console.log(error);
        console.log('[seed] : something went wrong while seeding');
    }
}))();

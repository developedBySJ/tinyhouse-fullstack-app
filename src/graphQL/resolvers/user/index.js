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
exports.userResolver = void 0;
const utils_1 = require("../../../lib/utils");
const userResolver = {
    Query: {
        user: (_root, { id }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const user = yield db.users.findOne({ _id: id });
                if (!user) {
                    throw new Error("user can't be found");
                }
                const viewer = yield utils_1.authorize(db, req);
                console;
                user.authorized = false;
                if (viewer && viewer._id === user._id) {
                    user.authorized = true;
                }
                return user;
            }
            catch (error) {
                throw new Error(`Failed to query user :${error}`);
            }
        })
    },
    User: {
        id: (user) => user._id,
        hasWallet: (user) => !!user.walletId,
        income: (user) => user.authorized ? user.income : null,
        bookings: (user, { limit, page }, { db }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!user.authorized) {
                    return null;
                }
                let cursor = db.bookings.find({ _id: { $in: user.bookings } });
                cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
                cursor = cursor.limit(limit);
                const total = yield cursor.count();
                if (total < 1) {
                    return null;
                }
                const result = yield cursor.toArray();
                const data = {
                    total,
                    result
                };
                return data;
            }
            catch (error) {
                console.log(error);
                throw new Error("failed to query bookings");
            }
        }),
        listings: (user, { limit, page }, { db }) => __awaiter(void 0, void 0, void 0, function* () {
            let cursor = db.listings.find({ _id: { $in: user.listings } });
            cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
            cursor.limit(limit);
            const total = yield cursor.count();
            if (total < 1) {
                return null;
            }
            const result = yield cursor.toArray();
            const data = {
                total,
                result
            };
            return data;
        }),
    }
};
exports.userResolver = userResolver;

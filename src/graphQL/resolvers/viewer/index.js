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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewerResolvers = void 0;
const api_1 = require("../../../lib/api");
const crypto_1 = __importDefault(require("crypto"));
const utils_1 = require("../../../lib/utils");
const api_2 = require("../../../lib/api");
const cookieOptions = {
    secure: process.env.NODE_ENV === 'developement' ? false : true,
    maxAge: 365 * 24 * 3600,
    sameSite: true,
    httpOnly: true,
    signed: true
};
const loginViaCookie = (token, db, req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db.users.findOneAndUpdate({ _id: req.signedCookies.viewer }, {
        $set: { token },
    }, { returnOriginal: false });
    let viewer = user.value;
    if (!viewer) {
        res.clearCookie('viewer', cookieOptions);
    }
    return viewer;
});
const logInViaGoogle = (code, token, db, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { user } = yield api_1.Google.logIn(code);
    if (!user) {
        throw new Error("google login error");
    }
    const userNameList = ((_a = user === null || user === void 0 ? void 0 : user.names) === null || _a === void 0 ? void 0 : _a.length) ? user.names : null;
    const userEmailList = ((_b = user === null || user === void 0 ? void 0 : user.emailAddresses) === null || _b === void 0 ? void 0 : _b.length) ? user.emailAddresses : null;
    const userPhotsList = ((_c = user === null || user === void 0 ? void 0 : user.photos) === null || _c === void 0 ? void 0 : _c.length) ? user.photos : null;
    // user name
    const name = userNameList ? userNameList[0].displayName : null;
    // userId
    const userId = userNameList &&
        userNameList[0].metadata &&
        userNameList[0].metadata.source
        ? userNameList[0].metadata.source.id : null;
    // user avatar
    const avatar = userPhotsList && userPhotsList[0].url ? userPhotsList[0].url : null;
    // email
    const contact = userEmailList && userEmailList[0].value ? userEmailList[0].value : null;
    if (!name || !userId || !avatar || !contact) {
        throw new Error("google login error");
    }
    const updatedUser = yield db.users.findOneAndUpdate({ _id: userId }, {
        $set: {
            avatar,
            token,
            contact,
            name,
        },
    }, { returnOriginal: false });
    let viewer = updatedUser.value;
    if (!viewer) {
        const newUser = yield db.users.insertOne({
            _id: userId,
            avatar,
            bookings: [],
            contact,
            income: 0,
            listings: [],
            name,
            token,
        });
        viewer = newUser.ops[0];
    }
    res.cookie('viewer', userId, cookieOptions);
    return viewer;
});
exports.viewerResolvers = {
    Query: {
        authUrl: () => {
            try {
                return api_1.Google.authUrl;
            }
            catch (error) {
                throw new Error(`failed to query google auth url : ${error}`);
            }
            ;
        },
    },
    Mutation: {
        logIn: (_root, { input }, { db, res, req }) => __awaiter(void 0, void 0, void 0, function* () {
            const code = input ? input.code : null;
            const token = crypto_1.default.randomBytes(16).toString('hex');
            try {
                const viewer = code ? yield logInViaGoogle(code, token, db, res) : yield loginViaCookie(token, db, req, res);
                if (!viewer) {
                    return { didRequest: true };
                }
                return {
                    didRequest: true,
                    _id: viewer._id,
                    avatar: viewer.avatar,
                    token: viewer.token,
                    walletId: viewer.walletId,
                    name: viewer.name
                };
            }
            catch (error) {
                throw new Error(`Failed To Login : ${error}`);
            }
        }),
        logOut: (_root, { input }, { db, res }) => {
            res.clearCookie('viewer', cookieOptions);
            return {
                didRequest: true,
            };
        },
        connectStripe: (_root, { input }, { db, res, req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { code } = input;
                let viewer = yield utils_1.authorize(db, req);
                if (!viewer) {
                    throw new Error("viewer cannot be found");
                }
                const wallet = yield api_2.Stripe.connect(code);
                if (!wallet) {
                    throw new Error("stripe grant error");
                }
                const updatedUser = yield db.users.findOneAndUpdate({ _id: viewer._id }, { $set: { walletId: wallet.stripe_user_id } }, {
                    returnOriginal: false
                });
                if (!updatedUser.value) {
                    throw new Error("viewer could not be updated");
                }
                viewer = updatedUser.value;
                return {
                    didRequest: true,
                    avatar: viewer.avatar,
                    name: viewer.name,
                    token: viewer.token,
                    walletId: viewer.walletId,
                    _id: viewer._id
                };
            }
            catch (error) {
                throw new Error("failed to connect with stripe : " + error);
            }
        }),
        disconnectStripe: (_root, {}, { db, res, req }) => __awaiter(void 0, void 0, void 0, function* () {
            let viewer = yield utils_1.authorize(db, req);
            if (!viewer) {
                throw new Error("viewer cannot be found");
            }
            const updatedUser = yield db.users.findOneAndUpdate({ _id: viewer._id }, { $set: { walletId: undefined } }, {
                returnOriginal: false
            });
            if (!updatedUser.value) {
                throw new Error("viewer could not be updated");
            }
            viewer = updatedUser.value;
            return {
                didRequest: true,
                avatar: viewer.avatar,
                name: viewer.name,
                token: viewer.token,
                walletId: viewer.walletId,
                _id: viewer._id
            };
        })
    },
    Viewer: {
        id: (viewer) => { return viewer._id; },
        hasWallet: (viewer) => { return viewer.walletId ? true : undefined; }
    }
};

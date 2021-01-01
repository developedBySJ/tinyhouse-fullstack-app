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
exports.Google = void 0;
const axios_1 = __importDefault(require("axios"));
const googleapis_1 = require("googleapis");
const auth = new googleapis_1.google.auth.OAuth2(process.env.G_CLIENT_ID, process.env.G_CLIENT_SECRET, process.env.PUBLIC_URL);
// eslint-disable-next-line @typescript-eslint/camelcase
const parseAddress = ({ administrative_area, country: locCountry, county, locality, name }) => {
    let country, city, admin = null;
    // eslint-disable-next-line @typescript-eslint/camelcase
    if (administrative_area) {
        admin = administrative_area;
    }
    if (county) {
        city = county;
    }
    if (locCountry) {
        country = locCountry;
    }
    else {
        throw new Error("failed to find geocode");
    }
    const region = [...new Set(`${name || ""}|${locality || ""}|${country || ""}`.split('|').filter((i => !!i)))].join(', ');
    return { country, city, admin, region };
};
exports.Google = {
    authUrl: auth.generateAuthUrl({
        // eslint-disable-next-line @typescript-eslint/camelcase
        access_type: 'online',
        scope: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ]
    }),
    logIn: (code) => __awaiter(void 0, void 0, void 0, function* () {
        const { tokens } = yield auth.getToken(code);
        auth.setCredentials(tokens);
        const { data } = yield googleapis_1.google.people({ version: 'v1', auth }).people.get({
            resourceName: 'people/me',
            personFields: 'emailAddresses,names,photos'
        });
        return { user: data };
    }),
    geocode: (address) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { data, status } = yield axios_1.default.get(`http://api.positionstack.com/v1/forward?access_key=${process.env.GEOCODE_KEY}&query=${address}`);
            if (status < 200 || status > 299) {
                throw new Error("failed to geocode address");
            }
            // console.log({ RESPONSE: data.data[0] })
            return parseAddress(data.data[0]);
        }
        catch (error) {
            throw new Error("failed to geocode location:" + error);
        }
    })
};

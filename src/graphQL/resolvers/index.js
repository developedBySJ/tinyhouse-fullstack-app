"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const lodash_merge_1 = __importDefault(require("lodash.merge"));
const Bookings_1 = require("./Bookings");
const Listings_1 = require("./Listings");
const user_1 = require("./user");
const viewer_1 = require("./viewer");
exports.resolvers = lodash_merge_1.default(viewer_1.viewerResolvers, user_1.userResolver, Bookings_1.bookingResolver, Listings_1.listingResolver);

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
exports.listingResolver = void 0;
const mongodb_1 = require("mongodb");
const api_1 = require("../../../lib/api");
const Cloudinary_1 = require("../../../lib/api/Cloudinary");
const types_1 = require("../../../lib/types");
const utils_1 = require("../../../lib/utils");
const types_2 = require("./types");
const verifyHostListingInput = ({ address, description, title, type, price }) => {
    if (title.length > 100) {
        throw new Error("listing title must be under 100 character");
    }
    if (description.length > 500) {
        throw new Error("listing description must be under 100 character");
    }
    if (!Object.keys(types_1.ListingType).includes(type)) {
        throw new Error("listing type must b either apartment or house");
    }
    if (price < 0) {
        throw new Error("price must be greater than zero");
    }
};
exports.listingResolver = {
    Query: {
        listings: (_root, { filter, limit, page, location }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const query = {};
                let locRegion;
                if (location) {
                    const { admin, city, country, region } = yield api_1.Google.geocode(location);
                    if (city) {
                        query.city = city;
                    }
                    if (admin) {
                        query.admin = admin;
                    }
                    if (region) {
                        locRegion = region;
                    }
                    if (country) {
                        query.country = country;
                    }
                    else {
                        throw new Error("no country found");
                    }
                }
                let cursor = db.listings.find(query);
                if (filter && filter === types_2.ListingFilter.PRICE_HIGH_TO_LOW) {
                    cursor = cursor.sort({ price: -1 });
                }
                if (filter && filter === types_2.ListingFilter.PRICE_LOW_TO_HIGH) {
                    cursor = cursor.sort({ price: 1 });
                }
                cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
                cursor = cursor.limit(limit);
                const total = yield cursor.count();
                const result = yield cursor.toArray();
                const data = {
                    region: locRegion || location,
                    total,
                    result
                };
                return data;
            }
            catch (error) {
                // console.log(error)
                throw new Error("failed to query listings");
            }
        }),
        listing: (_root, { id }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // console.log({ OBJECTID: new ObjectId(id), id })
                const listing = yield db.listings.findOne({ _id: new mongodb_1.ObjectId(id) });
                if (!listing) {
                    throw new Error("listing can't be found");
                }
                const viewer = yield utils_1.authorize(db, req);
                listing.authorized = false;
                if (viewer && viewer._id === listing.host) {
                    listing.authorized = true;
                }
                return listing;
            }
            catch (error) {
                throw new Error("fail to query listing" + error);
            }
        })
    },
    Mutation: {
        hostListing: (_root, { input }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            let viewer = yield utils_1.authorize(db, req);
            if (!viewer) {
                throw new Error("viewer can not be found");
            }
            const { admin, city, country } = yield api_1.Google.geocode(input.address.toLocaleLowerCase());
            // console.log({ MAINaddress: input.address, admin, city, country })
            if (!city || !country) {
                throw new Error("invalid address input");
            }
            const imgUrl = yield Cloudinary_1.Cloudinary.upload(input.image);
            const insertResult = yield db.listings.insertOne(Object.assign(Object.assign({ _id: new mongodb_1.ObjectId() }, input), { image: imgUrl, bookings: [], admin: admin ? admin : city, bookingsIndex: {}, country,
                city, host: viewer._id }));
            const insertedListing = insertResult.ops[0];
            yield db.users.updateOne({ _id: viewer._id }, { $push: { listings: insertedListing._id } });
            return insertedListing;
        })
    },
    Listing: {
        id: (listing) => listing._id,
        host: (listing, { id }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            const host = yield db.users.findOne({ _id: listing.host });
            if (!host) {
                throw new Error("host can't be found");
            }
            return host;
        }),
        bookingsIndex: (listing) => {
            return JSON.stringify(listing.bookingsIndex);
        },
        bookings: (listing, { limit, page }, { db }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!listing.authorized) {
                    return null;
                }
                let cursor = db.bookings.find({ _id: { $in: listing.bookings } });
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
                // console.log(error)
                throw new Error("failed to query booking");
            }
        })
    },
};

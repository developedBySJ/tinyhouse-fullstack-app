"use strict";
// require('dotenv').config();
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
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const graphQL_1 = require("./graphQL");
const database_1 = require("./database");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const compression_1 = __importDefault(require("compression"));
const port = process.env.PORT || 9000;
const mount = (app) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield database_1.connectDatabase();
    app.use(cookie_parser_1.default(process.env.COOKIE_SECRET));
    app.use(body_parser_1.default.json({ limit: '3mb' }));
    app.use(compression_1.default());
    app.use(express_1.default.static(`${__dirname}/client`));
    app.get('/*', (_req, res) => { res.sendFile(`${__dirname}/client/index.html`); });
    const server = new apollo_server_express_1.ApolloServer({ resolvers: graphQL_1.resolvers, typeDefs: graphQL_1.typeDefs, context: ({ req, res }) => ({ db, req, res }) });
    app.post('/img', (_req, res) => {
        res.status(200).send({});
    });
    server.applyMiddleware({ app, path: '/api' });
    app.listen(port);
    console.log('[app] : Started Server on http://localhost:' + port);
});
mount(express_1.default());

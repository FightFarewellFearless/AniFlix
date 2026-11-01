import { createServer, Server } from 'react-native-nitro-http-server';
import type { IncomingMessage, ServerResponse } from 'react-native-nitro-http-server';

export interface HttpServerOptions {
  requestTimeout?: number;
}

export interface HttpServerAPI {
  createServer: (
    options: HttpServerOptions | undefined,
    callback: (req: IncomingMessage, res: ServerResponse) => void,
  ) => Server;
}

const androidHttpServer: HttpServerAPI = {
  createServer: (options, callback) =>
    options ? createServer(options, callback) : createServer(callback),
};

export default androidHttpServer;

export const HttpServer = androidHttpServer;

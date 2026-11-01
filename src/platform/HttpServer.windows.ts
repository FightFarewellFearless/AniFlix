import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

export interface HttpServerAPI {
  createServer: (
    options: { requestTimeout?: number } | undefined,
    callback: (req: IncomingMessage, res: ServerResponse) => void,
  ) => Server;
}

const windowsHttpServer: HttpServerAPI = {
  createServer: (options, callback) => {
    if (options?.requestTimeout !== undefined && !Number.isFinite(options.requestTimeout)) {
      // Node treats 0 as "no timeout"; Infinity is not accepted by http.Server.
      options = { ...options, requestTimeout: 0 };
    }
    return options ? createServer(options, callback) : createServer(callback);
  },
};

export default windowsHttpServer;

export const HttpServer = windowsHttpServer;

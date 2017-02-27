import * as http from 'http';

export interface ReloadOrError {
  reload: (name: string) => void;
  error: (name: string, errors: any[]) => void;
}

export interface HasServer {
  httpServer: http.Server;
}

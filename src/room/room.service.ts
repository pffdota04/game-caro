import { Injectable } from '@nestjs/common';
import { Client, ClientArray, Room } from 'colyseus';
import { Possion, RoomState } from './room.state';
import { x } from 'joi';
import { stat } from 'fs';

@Injectable()
export class RoomService extends Room<RoomState> {
  constructor() {
    super();
  }

  onCreate(options: any): void | Promise<any> {
    console.log('created room', this.roomId);
    if (options && options.isCreate) {
      this.setPrivate(true);
    }
    this.setState(new RoomState());

    this.onMessage('ready', (client) => {
      console.log(client.sessionId, 'ready');
      this.state.ready++;
    });
    this.onMessage('action', (client, message) => this.action(client, message));
    this.onMessage('outGame', (client, message) => this.outGame(client));
  }

  onJoin(
    client: Client<
      this['clients'] extends ClientArray<infer U, any> ? U : never,
      this['clients'] extends ClientArray<infer _, infer U> ? U : never
    >,
  ): void | Promise<any> {
    console.log('player joined', client.sessionId, this.roomId);
    this.state.clients.set(client.sessionId, true);
    if (this.state.clients.size === 2) {
      this.state.currentTurn = client.sessionId;
      // lock this room for new users
      this.lock();
      console.log('Room was locked');
      // ready for first
    }
  }

  onLeave(
    client: Client<
      this['clients'] extends ClientArray<infer U, any> ? U : never,
      this['clients'] extends ClientArray<infer _, infer U> ? U : never
    >,
  ): void | Promise<any> {
    console.log('player leaved', client.sessionId);
  }

  outGame(client: Client) {
    const clients = this.state.clients.toJSON();
    console.log(Object.keys(clients));

    if (Object.keys(clients)[0] == client.sessionId) {
      this.state.winner = Object.keys(clients)[1];
    } else this.state.winner = Object.keys(clients)[0];
  }

  action(client: Client, message: any) {
    console.log(client.sessionId, 'action');

    const clients = this.state.clients.toJSON();
    if (this.state.currentTurn !== client.sessionId) return;
    if (Object.keys(clients)[0] == client.sessionId) {
      this.state.currentTurn = Object.keys(clients)[1];
    } else this.state.currentTurn = Object.keys(clients)[0];

    // if (this.state.currentTurn !== client.sessionId) return;
    // this.state.clients.forEach((value, key) => {
    //   if (key !== client.sessionId) this.state.currentTurn = key;
    // });

    this.state.lastPossition = new Possion();
    this.state.lastPossition.x = message.x;
    this.state.lastPossition.y = message.y;
    this.state.lastPossition.xy = message.x + '' + message.y; // search cho de
    this.state.lastPossition.sessionId = client.sessionId;
    this.state.map.push(this.state.lastPossition);
    this.checkWinGame();
  }

  checkWinGame() {
    const array = this.state.map.toArray();
    const x = this.state.lastPossition.x;
    const y = this.state.lastPossition.y;
    const sessionId = this.state.lastPossition.sessionId;
    const neighbor = this.getNeighbor(x, y);

    const onlyMySession = array.filter((pos) => {
      // if (pos.sessionId == sessionId) console.log(pos.xy);

      return pos.sessionId == sessionId;
    });
    let winGame = 0;
    let w12 = 0;
    let w3 = 0;
    let w2 = 0;
    let w4 = 0;

    for (let i = 0; i < Object.keys(neighbor).length; i++) {
      const way = Object.keys(neighbor)[i];
      winGame = 0;
      const xy = neighbor[way].x + '' + neighbor[way].y;

      for (let index = 0; index < onlyMySession.length; index++) {
        const element = onlyMySession[index];
        if (element.xy == xy) {
          if (element.sessionId == sessionId) {
            const nextCheck = this.getNeighborByWay(
              neighbor[way].x,
              neighbor[way].y,
              way,
            );
            winGame = this.checkOnWayDeQuy(
              nextCheck.x,
              nextCheck.y,
              way,
              onlyMySession,
              sessionId,
              1,
            );
          }
          break; // breank for onlyMySession
        }
      }
      if (winGame !== 0) {
        if (way == 'up' || way == 'down') {
          w12 += winGame;
          if (w12 >= 4) {
            this.endGame(sessionId);
            return;
          }
        } else if (way == 'rightUp' || way == 'leftDown') {
          w2 += winGame;
          if (w2 >= 4) {
            this.endGame(sessionId);
            return;
          }
        } else if (way == 'left' || way == 'right') {
          w3 += winGame;
          if (w3 >= 4) {
            this.endGame(sessionId);
            return;
          }
        } else {
          w4 += winGame;
          if (w4 >= 4) {
            this.endGame(sessionId);
            return;
          }
        }
      }
    }
    console.log(w12, w2, w3, w4);
  }

  endGame(sessionId: string) {
    this.state.winner = sessionId;
    setTimeout(() => {
      console.log('dissconnect ROOM!');
      this.disconnect();
    }, 3000);
  }

  checkOnWayDeQuy(
    x: number,
    y: number,
    way: string,
    array: Possion[],
    sessionId: string,
    count: number,
  ): number {
    const xy = x + '' + y;

    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      if (element.xy == xy) {
        const nextCheck = this.getNeighborByWay(x, y, way);
        return this.checkOnWayDeQuy(
          nextCheck.x,
          nextCheck.y,
          way,
          array,
          sessionId,
          count + 1,
        );
      }
    }
    return count;
  }

  getNeighborByWay(x: number, y: number, way: string) {
    return this.getNeighbor(x, y)[way];
  }

  getNeighbor(x: number, y: number) {
    return {
      up: { x: x, y: y + 1 },
      rightUp: { x: x + 1, y: y + 1 },
      right: { x: x + 1, y: y },
      rightDown: { x: x + 1, y: y - 1 },
      down: { x: x, y: y - 1 },
      leftDown: { x: x - 1, y: y - 1 },
      left: { x: x - 1, y: y },
      leftUp: { x: x - 1, y: y + 1 },
    };
  }
}

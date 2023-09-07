import { Injectable } from '@nestjs/common';
import { Client, ClientArray, Room } from 'colyseus';
import { Possion, RoomState } from './room.state';
import { x } from 'joi';

@Injectable()
export class RoomService extends Room<RoomState> {
  constructor() {
    super();
  }

  onCreate(options: any): void | Promise<any> {
    console.log('created room', this.roomId);
    this.setState(new RoomState());

    this.onMessage('ready', () => {
      this.state.ready++;
    });
    this.onMessage('action', (client, message) => this.action(client, message));
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

  action(client: Client, message: any) {
    console.log(client.sessionId, 'action');

    if (this.state.currentTurn !== client.sessionId) return;
    this.state.clients.forEach((value, key) => {
      if (key !== client.sessionId) this.state.currentTurn = key;
    });

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
      return pos.sessionId == sessionId;
    });

    let winGame = false;
    for (let i = 0; i < Object.keys(neighbor).length; i++) {
      const way = Object.keys(neighbor)[i];

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

      if (winGame) {
        console.log('WINGAME');

        this.state.winner = sessionId;
        setTimeout(() => {
          console.log('dissconnect ROOM!');
          this.disconnect();
        }, 3000);
        return;
      }
    }
  }

  checkOnWayDeQuy(
    x: number,
    y: number,
    way: string,
    array: Possion[],
    sessionId: string,
    count: number,
  ): boolean {
    console.log('Count', count);

    if (count == 4) return true;
    else {
      const xy = x + '' + y;
      for (let index = 0; index < array.length; index++) {
        const element = array[index];
        if (element.xy == xy) {
          if (element.sessionId == sessionId) {
            count++;
            const nextCheck = this.getNeighborByWay(x, y, way);
            return this.checkOnWayDeQuy(
              nextCheck.x,
              nextCheck.y,
              way,
              array,
              sessionId,
              count,
            );
          }
          break;
        }
      }
      return false;
    }
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

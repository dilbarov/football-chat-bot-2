import {Injectable} from '@nestjs/common';

import * as statuses from './statuses';
import {IDoActionParams, IActionResult} from './base.action';
import {PlayerAction} from './player.action';
import {Event} from '../storage/models/event';
import {Player} from 'src/storage/models/player';

@Injectable()
export class PlayerAddAction extends PlayerAction {
    protected setEvent(): void {
        this.event = this.appEmitter.PERSON_ADD;
    }

    protected async doAction(params: IDoActionParams): Promise<IActionResult> {
        const activeEvent: Event = await this.storageService.findChatActiveEvent(
            params.chat,
        );

        if (!activeEvent) {
            return this.createActionResult(statuses.STATUS_NO_EVENT);
        }

        const name: string = this.resolveName(params.message);
        const existedPlayer: Player = await this.storageService.findPlayer(
            activeEvent,
            name,
        );

        if (existedPlayer) {
            return this.createActionResult(statuses.STATUS_ALREADY_ADDED, {
                name,
            });
        }

        const newPlayer: Player = await this.storageService.addPlayer(
            activeEvent,
            name,
        );

        return this.createActionResult(statuses.STATUS_SUCCESS, {
            name: newPlayer.name,
            ...(await this.getPlayersList(activeEvent)),
        });
    }
}

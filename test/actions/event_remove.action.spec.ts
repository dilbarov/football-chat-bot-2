import 'mocha';
import {expect} from 'chai';

import {
    createContextStub,
    createEventAddContextStub,
} from '../stubs/context.stub';
import {createModuleStub} from '../stubs/actions.module.stub';
import {clearDatabase} from '../helpers/db-helper';

import {AppEmitter} from '../../src/common/event-bus.service';
import {StorageService} from '../../src/storage/storage.service';
import * as statuses from '../../src/actions/statuses';
import {Chat} from '../../src/storage/models/chat';
import {Event} from '../../src/storage/models/event';
import {IParams} from '../../src/common/template.service';

describe('EventRemoveAction', () => {
    let appEmitter: AppEmitter;
    let storageService: StorageService;

    before(async () => {
        const testModule = await createModuleStub();

        appEmitter = testModule.get<AppEmitter>(AppEmitter);
        storageService = testModule.get<StorageService>(StorageService);
    });

    beforeEach(async () => {
        await clearDatabase(storageService);
    });

    describe('handle event', () => {
        it('should create chat if it does not exist yet', async () => {
            const chatCountBefore: number = await storageService.connection
                .getRepository(Chat)
                .count();
            expect(chatCountBefore).to.equal(0);

            await new Promise(resolve => {
                const ctx = createContextStub({}, resolve);
                appEmitter.emit(appEmitter.EVENT_REMOVE, ctx);
            });

            const chatCountAfter: number = await storageService.connection
                .getRepository(Chat)
                .count();
            expect(chatCountAfter).to.equal(1);
        });

        it('should return no_event response if active event was not found', async () => {
            const jsonRes: string = await new Promise(resolve => {
                const ctx = createContextStub({}, resolve);
                appEmitter.emit(appEmitter.EVENT_REMOVE, ctx);
            });

            const {params}: {params: IParams} = JSON.parse(jsonRes);
            expect(params.status).to.equal(statuses.STATUS_NO_EVENT);
        });

        describe('active event exists', () => {
            let events: Event[];

            beforeEach(async () => {
                await new Promise(resolve => {
                    const ctx = createEventAddContextStub({}, resolve);
                    appEmitter.emit(appEmitter.EVENT_ADD, ctx);
                });
            });

            it('should remove active event', async () => {
                events = await storageService.connection
                    .getRepository(Event)
                    .find({});
                expect(events).to.be.lengthOf(1);
                expect(events[0].active).to.equal(true);

                await new Promise(resolve => {
                    const ctx = createContextStub({}, resolve);
                    appEmitter.emit(appEmitter.EVENT_REMOVE, ctx);
                });

                events = await storageService.connection
                    .getRepository(Event)
                    .find({});
                expect(events).to.be.lengthOf(1);
                expect(events[0].active).to.equal(false);
            });

            it('should return success result', async () => {
                const jsonRes: string = await new Promise(resolve => {
                    const ctx = createContextStub({}, resolve);
                    appEmitter.emit(appEmitter.EVENT_REMOVE, ctx);
                });

                const {params}: {params: IParams} = JSON.parse(jsonRes);
                expect(params.status).to.equal(statuses.STATUS_SUCCESS);
            });
        });
    });
});

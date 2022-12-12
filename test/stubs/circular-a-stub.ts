import { constructable } from '../../src';
import CircularBStub from './circular-b-stub';

@constructable()
class CircularAStub {
    public constructor(public b: CircularBStub) {
        //
    }
}

export = CircularAStub;

import { constructable } from '../../src';
import CircularAStub from './circular-a-stub';

@constructable()
class CircularCStub {
    public constructor(public a: CircularAStub) {
        //
    }
}

export = CircularCStub;

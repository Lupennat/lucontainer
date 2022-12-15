import { constructable } from '../..';
import CircularCStub from './circular-c-stub';

@constructable()
class CircularBStub {
    public constructor(public c: CircularCStub) {
        //
    }
}

export default CircularBStub;

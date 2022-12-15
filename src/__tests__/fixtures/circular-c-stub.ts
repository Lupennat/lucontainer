import { constructable } from '../..';
import CircularAStub from './circular-a-stub';

@constructable()
class CircularCStub {
    public constructor(public a: CircularAStub) {
        //
    }
}

export default CircularCStub;

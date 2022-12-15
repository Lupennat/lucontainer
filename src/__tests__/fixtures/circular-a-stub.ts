import { constructable } from '../..';
import CircularBStub from './circular-b-stub';

@constructable()
class CircularAStub {
    public constructor(public b: CircularBStub) {
        //
    }
}

export default CircularAStub;

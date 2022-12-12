import { expect } from 'chai';
import { annotate, constructable, inject, methodable } from '../../src';

interface TestContract {}

describe('Annotations', () => {
    it('Works Constructable', () => {
        @constructable('TestContract')
        class Test implements TestContract {
            constructor(a: string = 'test') {}
        }
        expect(Reflect.getMetadata('design:paramtypes', Test)).to.eql([String]);
        expect(Reflect.getMetadata('design:paramdefinitions', Test)).to.eql([
            {
                allowsNull: false,
                className: 'Test',
                hasDefault: true,
                index: 0,
                isVariadic: false,
                name: 'a',
                rawDefaultValue: 'test'
            }
        ]);
        expect(Reflect.getMetadata('design:interfaces', Test)).to.eql(['TestContract']);
    });

    it('Works Methodable', () => {
        class Test implements TestContract {
            @methodable()
            method(a: string = 'test'): string {
                return a;
            }
        }
        expect(Reflect.getMetadata('design:paramtypes', Test.prototype, 'method')).to.eql([String]);
        expect(Reflect.getMetadata('design:paramdefinitions', Test.prototype, 'method')).to.eql([
            {
                allowsNull: false,
                className: 'Test',
                hasDefault: true,
                index: 0,
                isVariadic: false,
                name: 'a',
                rawDefaultValue: 'test'
            }
        ]);
    });

    it('Works Inject', () => {
        class Test implements TestContract {
            method(@inject('Test') a: string = 'test', b: number = 0): string {
                return a;
            }
        }
        expect(Reflect.getMetadata('design:paramtypes', Test.prototype, 'method')).to.eql(['Test', Number]);
    });

    it('Works Annotate', () => {
        const TestFn = function (a: string = 'test') {};
        TestFn.prototype.method = function (a: string = 'test'): string {
            return a;
        };

        annotate(TestFn, ['TestContract'], [String]);
        expect(Reflect.getMetadata('design:paramtypes', TestFn)).to.eql([String]);
        expect(Reflect.getMetadata('design:paramdefinitions', TestFn)).to.eql([
            {
                allowsNull: false,
                className: 'TestFn',
                hasDefault: true,
                index: 0,
                isVariadic: false,
                name: 'a',
                rawDefaultValue: 'test'
            }
        ]);
        expect(Reflect.getMetadata('design:interfaces', TestFn)).to.eql(['TestContract']);

        annotate(TestFn.prototype, 'method', [String]);

        expect(Reflect.getMetadata('design:paramtypes', TestFn.prototype, 'method')).to.eql([String]);
        expect(Reflect.getMetadata('design:paramdefinitions', TestFn.prototype, 'method')).to.eql([
            {
                allowsNull: false,
                className: 'TestFn',
                hasDefault: true,
                index: 0,
                isVariadic: false,
                name: 'a',
                rawDefaultValue: 'test'
            }
        ]);
    });

    it('Works Annotate Return', () => {
        class Test {}
        const TestVar = annotate(Test);

        expect(TestVar === Test).to.be.true;
    });
});

/* eslint-disable @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars */

import { annotate, constructable, inject, methodable } from '../../decorators';

interface TestContract {}

describe('Annotations', () => {
    it('Works Constructable', () => {
        @constructable('TestContract')
        class Test implements TestContract {
            constructor(a = 'test') {}
        }
        expect(Reflect.getMetadata('design:paramtypes', Test)).toEqual([Object]);
        expect(Reflect.getMetadata('design:paramdefinitions', Test)).toEqual([
            {
                allowsNull: false,
                className: 'Test',
                hasDefault: true,
                index: 0,
                isVariadic: false,
                name: 'a',
                rawDefaultValue: 'test',
                type: String
            }
        ]);
        expect(Reflect.getMetadata('design:interfaces', Test)).toEqual(['TestContract']);
    });

    it('Works Methodable', () => {
        class Test implements TestContract {
            @methodable()
            method(a: string): string {
                return a;
            }
        }
        expect(Reflect.getMetadata('design:paramtypes', Test.prototype, 'method')).toEqual([String]);
        expect(Reflect.getMetadata('design:paramdefinitions', Test.prototype, 'method')).toEqual([
            {
                allowsNull: false,
                className: 'Test',
                hasDefault: false,
                index: 0,
                isVariadic: false,
                name: 'a',
                rawDefaultValue: undefined,
                type: undefined
            }
        ]);
    });

    it('Works Inject', () => {
        class Test implements TestContract {
            method(@inject('Test') a = 'test', b = 0): string {
                return a;
            }
        }
        expect(Reflect.getMetadata('design:paramtypes', Test.prototype, 'method')).toEqual(['Test', Object]);
    });

    it('Works Annotate', () => {
        const TestFn = function (a = 'test'): void {};
        TestFn.prototype.method = function (a = 'test'): string {
            return a;
        };

        annotate(TestFn, ['TestContract'], [String]);
        expect(Reflect.getMetadata('design:paramtypes', TestFn)).toEqual([String]);
        expect(Reflect.getMetadata('design:paramdefinitions', TestFn)).toEqual([
            {
                allowsNull: false,
                className: 'TestFn',
                hasDefault: true,
                index: 0,
                isVariadic: false,
                name: 'a',
                rawDefaultValue: 'test',
                type: String
            }
        ]);
        expect(Reflect.getMetadata('design:interfaces', TestFn)).toEqual(['TestContract']);

        annotate(TestFn.prototype, 'method', [String]);

        expect(Reflect.getMetadata('design:paramtypes', TestFn.prototype, 'method')).toEqual([String]);
        expect(Reflect.getMetadata('design:paramdefinitions', TestFn.prototype, 'method')).toEqual([
            {
                allowsNull: false,
                className: 'TestFn',
                hasDefault: true,
                index: 0,
                isVariadic: false,
                name: 'a',
                rawDefaultValue: 'test',
                type: String
            }
        ]);
    });

    it('Works Annotate Return', () => {
        class Test {}
        const TestVar = annotate(Test);

        expect(TestVar === Test).toBeTruthy();
    });
});

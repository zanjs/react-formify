import FormState from '../FormState';

import { isObject } from '../utils';

test('FormState fails to instantiate without rules', () => {
  expect(() => new FormState()).toThrowError('Rules is a required argument');
  expect(() => new FormState({})).toThrowError('Rules is a required argument');
});

test('FormState instantiate with valid basic rule', () => {
  const formState = new FormState({
    email: 'is required',
  });
  expect(formState).toMatchSnapshot();
  expect(formState.isValid()).toBeFalsy();
  expect(formState.getErrors()).toMatchSnapshot();
});

const emailExpression = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function deepMerge(target, ...sources) {
  if (!sources.length) {
    return target;
  }
  // making sure to not change target (immutable)
  const output = { ...target };
  const source = sources.shift();
  if (isObject(output) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!output[key]) {
          output[key] = { ...source[key] };
        } else {
          output[key] = deepMerge({}, output[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return deepMerge(output, ...sources);
}

test('FormState validates rules', () => {
  const formState = new FormState((user) => {
    const defaultValidation = {
      email: (value) => {
        if (!value || value === '') {
          return 'Email is required';
        } else if (!emailExpression.test(value)) {
          return 'Email is not valid';
        }
        return undefined;
      },
      name: 'Name is required',
      size: 'Size is required',
      confirm: 'Please confirm answers',
      kids: (value, index) => {
        if (index >= 0) {
          if (!value[index].name) {
            return { name: 'Name is required' };
          }
        } else if (!value || !value.length) {
          return 'You need to have at least one kid';
        }
        return undefined;
      },
      address: {
        home: {
          street: 'Street is required',
        },
      },
    };
    if (
      user.address &&
      user.address.home &&
      user.address.home.street &&
      user.address.home.street !== ''
    ) {
      return deepMerge(defaultValidation, {
        address: {
          city: 'City is required if you provided street',
        },
      });
    }
    return defaultValidation;
  });
  expect(formState).toMatchSnapshot();
  expect(formState.isValid()).toBeFalsy();
  expect(formState.getErrors()).toMatchSnapshot();

  formState.set('email', 'a');

  expect(formState.isValid()).toBeFalsy();
  expect(formState.getErrors()).toMatchSnapshot();

  formState.set('kids', [{ age: 10 }]);

  expect(formState.isValid()).toBeFalsy();
  expect(formState.getErrors()).toMatchSnapshot();

  formState.set('address.home.street', 'street');

  expect(formState.isValid()).toBeFalsy();
  expect(formState.getErrors()).toMatchSnapshot();

  formState.set('email', 'a@test.com');
  formState.set('name', 'name');
  formState.set('size', 'big');
  formState.set('confirm', true);
  formState.set('address.city', 'city');
  formState.set('kids', [{ name: 'paul', age: 10 }]);

  expect(formState.isValid()).toBeTruthy();
  expect(formState.getErrors()).toMatchSnapshot();
  expect(formState.get()).toMatchSnapshot();
});

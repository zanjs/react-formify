import { isObject, setValueByKey } from './utils';

export default class FormState {
  constructor(rules, obj = {}, onChange) {
    if (!rules || (typeof rules !== 'function' && !Object.keys(rules).length)) {
      throw new Error('Rules is a required argument');
    }
    this.rules = rules;
    this.obj = obj;
    this.onChange = onChange;
  }
  set = (key, value) => {
    setValueByKey(this.obj, key, value);
    if (this.onChange) {
      this.onChange();
    }
  };
  get = () => this.obj;
  getErrors = (rules, target) => {
    const errors = {};
    const targetRules = (
      rules || (typeof this.rules === 'function' ? this.rules(this.obj) : this.rules)
    );
    const targetObject = target || this.obj;
    Object.keys(targetRules).forEach((key) => {
      const rule = targetRules[key];
      if (typeof rule === 'function') {
        const value = targetObject[key];
        if (Array.isArray(value)) {
          const errorsArray = [];
          value.forEach((v, index) => {
            const message = rule(targetObject[key], index, targetObject);
            if (message) {
              errorsArray[index] = message;
            }
          });
          if (errorsArray.length) {
            errors[key] = errorsArray;
          }
        } else {
          const message = rule(targetObject[key], undefined, targetObject);
          if (message) {
            errors[key] = message;
          }
        }
      } else if (isObject(rule)) {
        const ruleErrors = this.getErrors(rule, targetObject[key]);
        if (Object.keys(ruleErrors).length) {
          errors[key] = ruleErrors;
        }
      } else if (typeof rule === 'string' && !targetObject[key]) {
        errors[key] = rule;
      }
    });
    return errors;
  };
  isValid = () => !Object.keys(this.getErrors()).length
}

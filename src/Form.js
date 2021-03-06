import React, { Component } from 'react';
import PropTypes from 'prop-types';

import FormState from './FormState';

import { getValueByKey, isObject } from './utils';

export default class Form extends Component {
  static defaultProps = {
    defaultErrors: undefined,
    defaultValue: undefined,
  }
  static propTypes = {
    children: PropTypes.func.isRequired,
    defaultErrors: PropTypes.object,
    defaultValue: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    rules: PropTypes.object.isRequired,
  }
  constructor(props, context) {
    super(props, context);

    const formState = new FormState(props.rules, props.defaultValue, this.onChange);

    this.state = {
      formState,
      resource: formState.get(),
      errors: props.defaultErrors,
      rules: props.rules,
      isFormSubmitted: false,
    };
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.rules !== this.props.rules ||
      nextProps.defaultErrors !== this.props.defaultErrors ||
      nextProps.defaultValue !== this.props.defaultValue
    ) {
      const formState = new FormState(nextProps.rules, nextProps.defaultValue, this.onChange);

      this.setState({
        formState,
        resource: formState.get(),
        errors: nextProps.defaultErrors,
        rules: nextProps.rules,
      });
    }
  }
  onChange = () => {
    const { isFormSubmitted, formState } = this.state;
    if (isFormSubmitted) {
      this.setState({ resource: formState.get(), errors: formState.getErrors() });
    } else {
      this.setState({ resource: formState.get(), errors: undefined });
    }
  }
  onSubmit = (event) => {
    const { onSubmit } = this.props;
    const { formState, resource } = this.state;
    event.preventDefault();
    if (formState.isValid()) {
      onSubmit(resource);
    } else {
      this.setState({ isFormSubmitted: true, errors: formState.getErrors() });
    }
  }
  getStateValue = (key) => {
    const { formState, resource } = this.state;
    return {
      name: key,
      value: getValueByKey(resource, key) || '',
      checked: getValueByKey(resource, key) === true,
      onChange: (event) => {
        let value = event.option || event.target.value;
        if (event.target && (event.target.value === '' || event.target.value === 'true')) {
          value = event.target.checked;
        }
        formState.set(key, value);
      },
    };
  }
  getObjectStateValue = (obj, parentKey) => {
    const objStateValue = {};
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string' || typeof obj[key] === 'function') {
        objStateValue[key] = this.getStateValue(parentKey ? `${parentKey}.${key}` : key);
      } else if (isObject(obj[key])) {
        objStateValue[key] = this.getObjectStateValue(
          obj[key], parentKey ? `${parentKey}.${key}` : key
        );
      }
    });
    return objStateValue;
  }
  render() {
    const { children } = this.props;
    const { errors = {}, resource, rules } = this.state;
    const state = this.getObjectStateValue(typeof rules === 'function' ? rules(resource) : rules);
    state.get = key => this.getStateValue(key);
    errors.get = key => getValueByKey(errors, key);
    return (
      <form onSubmit={this.onSubmit}>
        {children(state, errors)}
      </form>
    );
  }
}

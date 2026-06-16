/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SettingInput } from '../../../src/components/settings/SettingInput';

jest.mock('react-native-vector-icons/FontAwesome5', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockIcon(props: { name: string }) {
    return React.createElement(Text, null, props.name);
  };
});

const colors = {
  text: '#111',
  textSecondary: '#666',
  primary: '#0af',
  surface: '#fff',
  border: '#ddd',
  background: '#000',
};

const styles = {
  settingItem: {},
  settingContent: {},
  settingTitleRow: {},
  settingTitle: {},
  settingDescription: {},
  disabledItem: {},
  disabledText: {},
  chevron: {},
  input: {},
  disabledInput: {},
};

describe('SettingInput', () => {
  it('renders label, icon, description, value, and error text', async () => {
    const { getByText, getByDisplayValue } = await render(
      <SettingInput
        item={{
          id: 'server-password',
          type: 'input',
          title: 'Server password',
          description: 'Stored securely',
          error: 'Required',
          value: 'secret',
          placeholder: 'Password',
          secureTextEntry: true,
        }}
        icon={{ name: 'lock', solid: true }}
        colors={colors}
        styles={styles}
        onValueChange={jest.fn()}
      />,
    );

    expect(getByText('lock')).toBeTruthy();
    expect(getByText('Server password')).toBeTruthy();
    expect(getByText('Stored securely')).toBeTruthy();
    expect(getByText('Required')).toBeTruthy();
    expect(getByDisplayValue('secret').props.secureTextEntry).toBe(true);
  });

  it('updates local text and reports changed values', async () => {
    const onValueChange = jest.fn();
    const { getByPlaceholderText } = await render(
      <SettingInput
        item={{
          id: 'quit-message',
          type: 'input',
          title: 'Quit message',
          value: 'Leaving',
          placeholder: 'Message',
          keyboardType: 'email-address',
        }}
        colors={colors}
        styles={styles}
        onValueChange={onValueChange}
      />,
    );

    const input = getByPlaceholderText('Message');
    await fireEvent.changeText(input, 'Gone');

    expect(onValueChange).toHaveBeenCalledWith('Gone');
    expect(input.props.value).toBe('Gone');
    expect(input.props.keyboardType).toBe('email-address');
  });

  it('keeps draft text while focused and resets to accepted value on blur', async () => {
    const { getByPlaceholderText, rerender } = await render(
      <SettingInput
        item={{
          id: 'part-message',
          type: 'input',
          title: 'Part message',
          value: 'Initial',
          placeholder: 'Message',
        }}
        colors={colors}
        styles={styles}
        onValueChange={jest.fn()}
      />,
    );

    const input = getByPlaceholderText('Message');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, 'Draft');

    await rerender(
      <SettingInput
        item={{
          id: 'part-message',
          type: 'input',
          title: 'Part message',
          value: 'Accepted',
          placeholder: 'Message',
        }}
        colors={colors}
        styles={styles}
        onValueChange={jest.fn()}
      />,
    );

    expect(getByPlaceholderText('Message').props.value).toBe('Draft');

    await fireEvent(getByPlaceholderText('Message'), 'blur');

    expect(getByPlaceholderText('Message').props.value).toBe('Accepted');
  });

  it('submits only enabled inputs with submit handlers', async () => {
    const onPress = jest.fn();
    const { getByPlaceholderText, rerender } = await render(
      <SettingInput
        item={{
          id: 'nick',
          type: 'input',
          title: 'Nick',
          value: 'majstor',
          placeholder: 'Nick',
        }}
        colors={colors}
        styles={styles}
        onValueChange={jest.fn()}
        onPress={onPress}
      />,
    );

    await fireEvent(getByPlaceholderText('Nick'), 'submitEditing');
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(
      <SettingInput
        item={{
          id: 'nick',
          type: 'input',
          title: 'Nick',
          value: 'majstor',
          placeholder: 'Nick',
          disabled: true,
        }}
        colors={colors}
        styles={styles}
        onValueChange={jest.fn()}
        onPress={onPress}
      />,
    );

    expect(getByPlaceholderText('Nick').props.editable).toBe(false);
    await fireEvent(getByPlaceholderText('Nick'), 'submitEditing');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders custom description nodes', async () => {
    const { getByText } = await render(
      <SettingInput
        item={{
          id: 'proxy',
          type: 'input',
          title: 'Proxy',
          value: '',
          descriptionNode: <Text>SOCKS5 or HTTP</Text>,
        }}
        colors={colors}
        styles={styles}
        onValueChange={jest.fn()}
      />,
    );

    expect(getByText('SOCKS5 or HTTP')).toBeTruthy();
  });
});

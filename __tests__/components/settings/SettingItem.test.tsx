/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SettingItem } from '../../../src/components/settings/SettingItem';

jest.mock('../../../src/components/settings/SettingSwitch', () => ({
  SettingSwitch: ({ item, onValueChange }: any) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity
        testID={`switch-${item.id}`}
        onPress={() => onValueChange(false)}
      >
        <Text>{`Switch:${item.id}`}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../../../src/components/settings/SettingButton', () => ({
  SettingButton: ({ item, onPress }: any) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity testID={`button-${item.id}`} onPress={onPress}>
        <Text>{`Button:${item.id}`}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../../../src/components/settings/SettingInput', () => ({
  SettingInput: ({ item, onValueChange }: any) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity
        testID={`input-${item.id}`}
        onPress={() => onValueChange('updated')}
      >
        <Text>{`Input:${item.id}`}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../../../src/components/settings/SettingSubmenu', () => ({
  SettingSubmenu: ({ item, onPress }: any) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity testID={`submenu-${item.id}`} onPress={onPress}>
        <Text>{`Submenu:${item.id}`}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('SettingItem', () => {
  const colors = {
    text: '#000',
    textSecondary: '#666',
    primary: '#0af',
    surface: '#fff',
    border: '#ddd',
    background: '#eee',
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
  };

  it('renders switch variant', () => {
    const { getByText } = render(
      <SettingItem
        item={{ id: 's1', type: 'switch', title: 'x', value: true }}
        colors={colors}
        styles={styles as any}
      />,
    );
    expect(getByText('Switch:s1')).toBeTruthy();
  });

  it('renders button variant', () => {
    const { getByText } = render(
      <SettingItem
        item={{ id: 'b1', type: 'button', title: 'x' }}
        colors={colors}
        styles={styles as any}
      />,
    );
    expect(getByText('Button:b1')).toBeTruthy();
  });

  it('renders input variant', () => {
    const { getByText } = render(
      <SettingItem
        item={{ id: 'i1', type: 'input', title: 'x', value: '' }}
        colors={colors}
        styles={styles as any}
      />,
    );
    expect(getByText('Input:i1')).toBeTruthy();
  });

  it('renders submenu variant', () => {
    const { getByText } = render(
      <SettingItem
        item={{ id: 'm1', type: 'submenu', title: 'x' }}
        colors={colors}
        styles={styles as any}
      />,
    );
    expect(getByText('Submenu:m1')).toBeTruthy();
  });

  it('renders custom variant via renderCustom callback', () => {
    const { getByText } = render(
      <SettingItem
        item={{ id: 'c1', type: 'custom', title: 'x' } as any}
        colors={colors}
        styles={styles as any}
        renderCustom={item => {
          const { Text } = require('react-native');
          return <Text>{`Custom:${item.id}`}</Text>;
        }}
      />,
    );
    expect(getByText('Custom:c1')).toBeTruthy();
  });

  it('forwards switch value changes to item and parent callbacks', () => {
    const itemOnValueChange = jest.fn();
    const parentOnValueChange = jest.fn();
    const { getByTestId } = render(
      <SettingItem
        item={{
          id: 's2',
          type: 'switch',
          title: 'x',
          value: true,
          onValueChange: itemOnValueChange,
        }}
        colors={colors}
        styles={styles as any}
        onValueChange={parentOnValueChange}
      />,
    );

    fireEvent.press(getByTestId('switch-s2'));

    expect(itemOnValueChange).toHaveBeenCalledWith(false);
    expect(parentOnValueChange).toHaveBeenCalledWith('s2', false);
  });

  it('forwards button presses to item and parent callbacks', () => {
    const itemOnPress = jest.fn();
    const parentOnPress = jest.fn();
    const { getByTestId } = render(
      <SettingItem
        item={{ id: 'b2', type: 'button', title: 'x', onPress: itemOnPress }}
        colors={colors}
        styles={styles as any}
        onPress={parentOnPress}
      />,
    );

    fireEvent.press(getByTestId('button-b2'));

    expect(itemOnPress).toHaveBeenCalledTimes(1);
    expect(parentOnPress).toHaveBeenCalledWith('b2');
  });

  it('forwards input value changes to item and parent callbacks', () => {
    const itemOnValueChange = jest.fn();
    const parentOnValueChange = jest.fn();
    const { getByTestId } = render(
      <SettingItem
        item={{
          id: 'i2',
          type: 'input',
          title: 'x',
          value: '',
          onValueChange: itemOnValueChange,
        }}
        colors={colors}
        styles={styles as any}
        onValueChange={parentOnValueChange}
      />,
    );

    fireEvent.press(getByTestId('input-i2'));

    expect(itemOnValueChange).toHaveBeenCalledWith('updated');
    expect(parentOnValueChange).toHaveBeenCalledWith('i2', 'updated');
  });

  it('opens submenus even if the item callback throws', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(jest.fn());
    const parentOnPress = jest.fn();
    const { getByTestId } = render(
      <SettingItem
        item={{
          id: 'm2',
          type: 'submenu',
          title: 'x',
          onPress: () => {
            throw new Error('boom');
          },
        }}
        colors={colors}
        styles={styles as any}
        onPress={parentOnPress}
      />,
    );

    fireEvent.press(getByTestId('submenu-m2'));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error in item.onPress:',
      expect.any(Error),
    );
    expect(parentOnPress).toHaveBeenCalledWith('m2');

    consoleErrorSpy.mockRestore();
  });
});

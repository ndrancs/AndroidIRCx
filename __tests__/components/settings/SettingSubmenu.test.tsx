/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingSubmenu } from '../../../src/components/settings/SettingSubmenu';

jest.mock('react-native-vector-icons/FontAwesome5', () => 'Icon');

describe('SettingSubmenu', () => {
  const mockColors = {
    primary: '#007AFF',
    textSecondary: '#666666',
  };

  const mockStyles = {
    settingItem: { padding: 16 },
    settingContent: { flex: 1 },
    settingTitleRow: { flexDirection: 'row', alignItems: 'center' },
    settingTitle: { fontSize: 16 },
    settingDescription: { fontSize: 14, color: '#666' },
    chevron: { fontSize: 18 },
  };

  const baseItem: any = {
    type: 'submenu',
    key: 'test-submenu',
    title: 'Test Submenu',
  };

  it('renders with title', async () => {
    const { getByText } = await render(
      <SettingSubmenu
        item={baseItem}
        icon={undefined}
        colors={mockColors}
        styles={mockStyles}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Test Submenu')).toBeTruthy();
  });

  it('renders chevron', async () => {
    const { getByText } = await render(
      <SettingSubmenu
        item={baseItem}
        icon={undefined}
        colors={mockColors}
        styles={mockStyles}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('›')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const mockOnPress = jest.fn();
    const { getByText } = await render(
      <SettingSubmenu
        item={baseItem}
        icon={undefined}
        colors={mockColors}
        styles={mockStyles}
        onPress={mockOnPress}
      />,
    );
    await fireEvent.press(
      getByText('Test Submenu').parent?.parent || getByText('Test Submenu'),
    );
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('renders with string description', async () => {
    const item = { ...baseItem, description: 'Select an option' };
    const { getByText } = await render(
      <SettingSubmenu
        item={item}
        icon={undefined}
        colors={mockColors}
        styles={mockStyles}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Select an option')).toBeTruthy();
  });

  it('renders with descriptionNode', async () => {
    const item = {
      ...baseItem,
      descriptionNode: <Text testID="custom-desc">Custom Description</Text>,
    };
    const { getByTestId } = await render(
      <SettingSubmenu
        item={item}
        icon={undefined}
        colors={mockColors}
        styles={mockStyles}
        onPress={jest.fn()}
      />,
    );
    expect(getByTestId('custom-desc')).toBeTruthy();
  });

  it('prefers descriptionNode over description when both provided', async () => {
    const item = {
      ...baseItem,
      description: 'Text description',
      descriptionNode: <Text testID="node-desc">Node Description</Text>,
    };
    const { getByTestId, queryByText } = await render(
      <SettingSubmenu
        item={item}
        icon={undefined}
        colors={mockColors}
        styles={mockStyles}
        onPress={jest.fn()}
      />,
    );
    expect(getByTestId('node-desc')).toBeTruthy();
    expect(queryByText('Text description')).toBeNull();
  });

  it('renders with icon', async () => {
    const { root } = await render(
      <SettingSubmenu
        item={baseItem}
        icon={{ name: 'cog', solid: true }}
        colors={mockColors}
        styles={mockStyles}
        onPress={jest.fn()}
      />,
    );
    expect(root).toBeTruthy();
  });

  it('renders without icon when icon is undefined', async () => {
    const { getByText } = await render(
      <SettingSubmenu
        item={baseItem}
        icon={undefined}
        colors={mockColors}
        styles={mockStyles}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Test Submenu')).toBeTruthy();
  });

  it('renders disabled state', async () => {
    const item = { ...baseItem, disabled: true };
    const { getByText } = await render(
      <SettingSubmenu
        item={item}
        icon={undefined}
        colors={mockColors}
        styles={mockStyles}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Test Submenu')).toBeTruthy();
  });

  it('renders numeric description', async () => {
    const item = { ...baseItem, description: 42 };
    const { getByText } = await render(
      <SettingSubmenu
        item={item}
        icon={undefined}
        colors={mockColors}
        styles={mockStyles}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('42')).toBeTruthy();
  });

  it('renders without description when neither provided', async () => {
    const { queryByText } = await render(
      <SettingSubmenu
        item={baseItem}
        icon={undefined}
        colors={mockColors}
        styles={mockStyles}
        onPress={jest.fn()}
      />,
    );
    // Should not have any description text (only title and chevron)
    expect(queryByText('›')).toBeTruthy();
  });
});

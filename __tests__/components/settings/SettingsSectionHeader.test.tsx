/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Tests for SettingsSectionHeader component - Wave 5
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsSectionHeader } from '../../../src/components/settings/SettingsSectionHeader';

jest.mock('react-native-vector-icons/FontAwesome5', () => 'Icon');

describe('SettingsSectionHeader', () => {
  const mockColors = {
    primary: '#007AFF',
    text: '#000000',
  };

  const mockStyles = {
    sectionHeader: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    sectionIcon: { marginRight: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },
    sectionToggle: { fontSize: 18 },
  };

  it('should render with title', async () => {
    const { getByText } = await render(
      <SettingsSectionHeader
        title="Test Section"
        isExpanded={false}
        onToggle={jest.fn()}
        colors={mockColors}
        styles={mockStyles}
      />,
    );

    expect(getByText('Test Section')).toBeTruthy();
  });

  it('should render expanded toggle', async () => {
    const { getByText } = await render(
      <SettingsSectionHeader
        title="Test Section"
        isExpanded={true}
        onToggle={jest.fn()}
        colors={mockColors}
        styles={mockStyles}
      />,
    );

    expect(getByText('-')).toBeTruthy();
  });

  it('should render collapsed toggle', async () => {
    const { getByText } = await render(
      <SettingsSectionHeader
        title="Test Section"
        isExpanded={false}
        onToggle={jest.fn()}
        colors={mockColors}
        styles={mockStyles}
      />,
    );

    expect(getByText('+')).toBeTruthy();
  });

  it('should call onToggle when pressed', async () => {
    const mockOnToggle = jest.fn();

    const { getByText } = await render(
      <SettingsSectionHeader
        title="Test Section"
        isExpanded={false}
        onToggle={mockOnToggle}
        colors={mockColors}
        styles={mockStyles}
      />,
    );

    await fireEvent.press(
      getByText('Test Section').parent?.parent || getByText('Test Section'),
    );

    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('should render with icon', async () => {
    const { getByText, root } = await render(
      <SettingsSectionHeader
        title="Test Section"
        icon={{ name: 'cog', solid: true }}
        isExpanded={false}
        onToggle={jest.fn()}
        colors={mockColors}
        styles={mockStyles}
      />,
    );

    expect(getByText('Test Section')).toBeTruthy();
    expect(root).toBeTruthy();
  });

  it('should not render toggle when disabled', async () => {
    const { getByText, queryByText } = await render(
      <SettingsSectionHeader
        title="Test Section"
        isExpanded={false}
        onToggle={jest.fn()}
        disabled={true}
        colors={mockColors}
        styles={mockStyles}
      />,
    );

    expect(getByText('Test Section')).toBeTruthy();
    expect(queryByText('+')).toBeNull();
    expect(queryByText('-')).toBeNull();
  });

  it('should not call onToggle when disabled', async () => {
    const mockOnToggle = jest.fn();

    const { getByText } = await render(
      <SettingsSectionHeader
        title="Test Section"
        isExpanded={false}
        onToggle={mockOnToggle}
        disabled={true}
        colors={mockColors}
        styles={mockStyles}
      />,
    );

    await fireEvent.press(
      getByText('Test Section').parent?.parent || getByText('Test Section'),
    );

    expect(mockOnToggle).not.toHaveBeenCalled();
  });
});

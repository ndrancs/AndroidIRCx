/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Tests for RenameModal component - Wave 5
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RenameModal } from '../../src/components/RenameModal';

const mockStyles = {
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: { padding: 12, marginLeft: 8 },
  modalButtonCancel: { backgroundColor: '#ccc' },
  modalButtonJoin: { backgroundColor: '#007AFF' },
  modalButtonText: { color: '#000' },
  modalButtonTextPrimary: { color: '#fff' },
};

describe('RenameModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    value: '',
    onChangeValue: jest.fn(),
    onRename: jest.fn(),
    styles: mockStyles,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should render when visible', async () => {
    const { getByText } = await render(<RenameModal {...defaultProps} />);
    expect(getByText('Rename Server Tab')).toBeTruthy();
  });

  it('should not render when not visible', async () => {
    const { queryByText } = await render(
      <RenameModal {...defaultProps} visible={false} />,
    );
    expect(queryByText('Rename Server Tab')).toBeNull();
  });

  it('should call onClose when Cancel is pressed', async () => {
    const { getByText } = await render(<RenameModal {...defaultProps} />);
    await fireEvent.press(getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onClose and onRename when Rename is pressed', async () => {
    const { getByText } = await render(<RenameModal {...defaultProps} />);
    await fireEvent.press(getByText('Rename'));
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(defaultProps.onRename).toHaveBeenCalled();
  });

  it('should call onChangeValue when text is entered', async () => {
    const { getByPlaceholderText } = await render(
      <RenameModal {...defaultProps} />,
    );
    const input = getByPlaceholderText('Enter new name');
    await fireEvent.changeText(input, 'New Server Name');
    expect(defaultProps.onChangeValue).toHaveBeenCalledWith('New Server Name');
  });

  it('should display current value in input', async () => {
    const { getByDisplayValue } = await render(
      <RenameModal {...defaultProps} value="Current Name" />,
    );
    expect(getByDisplayValue('Current Name')).toBeTruthy();
  });

  it('should have autoCapitalize set to none', async () => {
    const { getByPlaceholderText } = await render(
      <RenameModal {...defaultProps} />,
    );
    const input = getByPlaceholderText('Enter new name');
    expect(input.props.autoCapitalize).toBe('none');
  });

  it('should have autoCorrect set to false', async () => {
    const { getByPlaceholderText } = await render(
      <RenameModal {...defaultProps} />,
    );
    const input = getByPlaceholderText('Enter new name');
    expect(input.props.autoCorrect).toBe(false);
  });
});

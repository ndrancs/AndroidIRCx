import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import {
  DccTransfersModal,
  DccTransfer,
} from '../../src/components/DccTransfersModal';

const mockShareOpen = jest.fn();
const mockExists = jest.fn();

jest.mock('react-native-share', () => ({
  open: (...args: unknown[]) => mockShareOpen(...args),
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/doc',
  exists: (...args: unknown[]) => mockExists(...args),
}));

const styles = {
  modalOverlay: {},
  modalContent: {},
  modalTitle: {},
  optionText: {},
  destructiveOption: {},
};

const mk = (overrides: Partial<DccTransfer>): DccTransfer => ({
  id: '1',
  direction: 'incoming',
  status: 'pending',
  offer: { filename: 'file.txt' },
  bytesReceived: 0,
  ...overrides,
});

describe('DccTransfersModal', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockExists.mockResolvedValue(true);
    mockShareOpen.mockResolvedValue(undefined);
  });

  it('renders empty state', async () => {
    const { getByText } = await render(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        transfers={[]}
        onAccept={jest.fn()}
        onCancel={jest.fn()}
        styles={styles}
      />,
    );

    expect(getByText('No transfers')).toBeTruthy();
  });

  it('accepts pending incoming transfer', async () => {
    const onAccept = jest.fn().mockResolvedValue(undefined);

    const { getByText } = await render(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        transfers={[mk({ id: 'p1', offer: { filename: 'song.mp3' } })]}
        onAccept={onAccept}
        onCancel={jest.fn()}
        styles={styles}
      />,
    );

    await act(async () => {
      await fireEvent.press(getByText('Accept'));
    });

    expect(onAccept).toHaveBeenCalledWith('p1', '/doc/song.mp3');
  });

  it('handles resume and cancel actions', async () => {
    const onAccept = jest.fn().mockResolvedValue(undefined);
    const onCancel = jest.fn();

    const { getByText } = await render(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        transfers={[
          mk({ id: 'f1', status: 'failed', filePath: '/x/old.txt' }),
          mk({ id: 'd1', status: 'downloading' }),
        ]}
        onAccept={onAccept}
        onCancel={onCancel}
        styles={styles}
      />,
    );

    await act(async () => {
      await fireEvent.press(getByText('Resume'));
    });
    await fireEvent.press(getByText('Cancel'));

    expect(onAccept).toHaveBeenCalledWith('f1', '/x/old.txt');
    expect(onCancel).toHaveBeenCalledWith('d1');
  });

  it('opens completed incoming file through share', async () => {
    const transfer = mk({
      id: 'c1',
      status: 'completed',
      filePath: '/storage/emulated/0/Download/file.pdf',
      offer: { filename: 'file.pdf' },
    });

    const { getByText } = await render(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        transfers={[transfer]}
        onAccept={jest.fn()}
        onCancel={jest.fn()}
        styles={styles}
      />,
    );

    await act(async () => {
      await fireEvent.press(getByText('Open File'));
    });

    expect(mockExists).toHaveBeenCalledWith(
      '/storage/emulated/0/Download/file.pdf',
    );
    expect(mockShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'file:///storage/emulated/0/Download/file.pdf',
        type: 'application/pdf',
      }),
    );
  });

  it('shows alert when completed file path is missing', async () => {
    const transfer = mk({ id: 'c2', status: 'completed', filePath: undefined });

    const { queryByText } = await render(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        transfers={[transfer]}
        onAccept={jest.fn()}
        onCancel={jest.fn()}
        styles={styles}
      />,
    );

    expect(queryByText('Open File')).toBeNull();
  });

  it('renders minimize action only for active transfers and calls it', async () => {
    const onMinimize = jest.fn();
    const { getByText, rerender, queryByText } = await render(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        onMinimize={onMinimize}
        transfers={[mk({ id: 's1', status: 'sending' })]}
        onAccept={jest.fn()}
        onCancel={jest.fn()}
        styles={styles}
      />,
    );

    await fireEvent.press(getByText('Minimize'));
    expect(onMinimize).toHaveBeenCalled();

    await rerender(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        onMinimize={onMinimize}
        transfers={[
          mk({ id: 'c1', status: 'completed', filePath: '/doc/file.txt' }),
        ]}
        onAccept={jest.fn()}
        onCancel={jest.fn()}
        styles={styles}
      />,
    );

    expect(queryByText('Minimize')).toBeNull();
  });

  it('alerts when completed file no longer exists', async () => {
    mockExists.mockResolvedValue(false);
    const transfer = mk({
      id: 'gone',
      status: 'completed',
      filePath: '/storage/emulated/0/Download/file.txt',
      offer: { filename: 'file.txt' },
    });

    const { getByText } = await render(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        transfers={[transfer]}
        onAccept={jest.fn()}
        onCancel={jest.fn()}
        styles={styles}
      />,
    );

    await act(async () => {
      await fireEvent.press(getByText('Open File'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'File no longer exists at the saved location',
    );
  });

  it('alerts with friendly error for Uri/open failures and ignores share cancelation', async () => {
    const transfer = mk({
      id: 'uri',
      status: 'completed',
      filePath: '/storage/emulated/0/Download/file.mp3',
      offer: { filename: 'file.mp3' },
    });

    const { getByText } = await render(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        transfers={[transfer]}
        onAccept={jest.fn()}
        onCancel={jest.fn()}
        styles={styles}
      />,
    );

    mockShareOpen.mockRejectedValueOnce(new Error('null object reference Uri'));
    await act(async () => {
      await fireEvent.press(getByText('Open File'));
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Could not open file. The file may need to be moved to an accessible location or the app may need to be restarted.',
    );

    (Alert.alert as jest.Mock).mockClear();
    mockShareOpen.mockRejectedValueOnce(new Error('User did not share'));
    await act(async () => {
      await fireEvent.press(getByText('Open File'));
    });
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('alerts with a generic open-file message for other share errors', async () => {
    const transfer = mk({
      id: 'generic',
      status: 'completed',
      filePath: 'relative/path/file.bin',
      offer: { filename: 'file.bin' },
    });

    const { getByText } = await render(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        transfers={[transfer]}
        onAccept={jest.fn()}
        onCancel={jest.fn()}
        styles={styles}
      />,
    );

    mockShareOpen.mockRejectedValueOnce(new Error('generic failure'));
    await act(async () => {
      await fireEvent.press(getByText('Open File'));
    });

    expect(mockShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'file:///relative/path/file.bin',
        type: 'application/octet-stream',
      }),
    );
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Could not open file: generic failure',
    );
  });

  it('keeps modal content responder active', async () => {
    const { UNSAFE_root } = await render(
      <DccTransfersModal
        visible
        onClose={jest.fn()}
        transfers={[mk({ id: 'p1', status: 'pending' })]}
        onAccept={jest.fn()}
        onCancel={jest.fn()}
        styles={styles}
      />,
    );

    const responderView = UNSAFE_root.find(
      node => typeof node.props?.onStartShouldSetResponder === 'function',
    );
    expect(responderView.props.onStartShouldSetResponder()).toBe(true);
  });
});

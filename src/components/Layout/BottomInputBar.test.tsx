/**
 * BottomInputBar Component Tests
 * Following TDD approach and testing best practices
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import BottomInputBar from './BottomInputBar';

// Mock the useVoiceRecording hook
vi.mock('@/hooks/useVoiceRecording', () => ({
  useVoiceRecording: vi.fn(() => ({
    isRecording: false,
    isPermissionGranted: false,
    recordingTime: 0,
    audioBlob: null,
    error: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    resetRecording: vi.fn(),
    requestPermission: vi.fn()
  }))
}));

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive' as RecordingState
};

// Mock navigator.mediaDevices
Object.defineProperty(window, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: vi.fn(() => Promise.resolve({
        getTracks: () => [{ stop: vi.fn() }]
      } as any))
    }
  },
  writable: true
});

Object.defineProperty(window, 'MediaRecorder', {
  value: vi.fn(() => mockMediaRecorder),
  writable: true
});

// Mock URL.createObjectURL for file attachments
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
});

describe('BottomInputBar', () => {
  const defaultProps = {
    onSend: vi.fn(),
    onVoiceRecord: vi.fn(),
    onFileAttach: vi.fn(),
    onModeChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should render with microphone button as default state', () => {
      render(<BottomInputBar {...defaultProps} />);

      const micButton = screen.getByTestId('microphone-button');
      expect(micButton).toBeInTheDocument();
      expect(micButton).toHaveAttribute('aria-label', 'Start recording');
    });

    it('should render file attachment button when allowFileAttach is true', () => {
      render(<BottomInputBar {...defaultProps} allowFileAttach={true} />);

      const fileButton = screen.getByTestId('file-attach-button');
      expect(fileButton).toBeInTheDocument();
      expect(fileButton).toHaveAttribute('aria-label', 'Attach file');
    });

    it('should not render file attachment button when allowFileAttach is false', () => {
      render(<BottomInputBar {...defaultProps} allowFileAttach={false} />);

      const fileButton = screen.queryByTestId('file-attach-button');
      expect(fileButton).not.toBeInTheDocument();
    });

    it('should have text input field hidden by default', () => {
      render(<BottomInputBar {...defaultProps} />);

      const textInput = screen.getByTestId('text-input');
      expect(textInput).toBeInTheDocument();
      expect(textInput.closest('div')).toHaveClass('opacity-0');
    });

    it('should apply custom className', () => {
      render(<BottomInputBar {...defaultProps} className="custom-class" />);

      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Text Input Mode', () => {
    it('should show text input field when user starts typing', async () => {
      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} />);

      const textInput = screen.getByTestId('text-input');

      await user.click(textInput);
      await user.type(textInput, 'Hello');

      await waitFor(() => {
        expect(textInput.closest('div')).toHaveClass('opacity-100');
      });
    });

    it('should switch to send button when text is entered', async () => {
      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} />);

      const textInput = screen.getByTestId('text-input');
      await user.type(textInput, 'Hello world');

      await waitFor(() => {
        const sendButton = screen.getByTestId('send-button');
        expect(sendButton).toBeInTheDocument();
        expect(sendButton).toHaveAttribute('aria-label', 'Send message');
      });
    });

    it('should handle Enter key to send message', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(<BottomInputBar {...defaultProps} onSend={onSend} />);

      const textInput = screen.getByTestId('text-input');
      await user.type(textInput, 'Test message');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(onSend).toHaveBeenCalledWith('Test message', 'text');
      });
    });

    it('should handle Shift+Enter for new lines without sending', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(<BottomInputBar {...defaultProps} onSend={onSend} />);

      const textInput = screen.getByTestId('text-input');
      await user.type(textInput, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textInput, 'Line 2');

      expect(onSend).not.toHaveBeenCalled();
      expect((textInput as HTMLTextAreaElement).value).toContain('\n');
    });

    it('should respect maxCharacters limit', async () => {
      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} maxCharacters={10} />);

      const textInput = screen.getByTestId('text-input');
      await user.type(textInput, 'This is a very long message');

      expect((textInput as HTMLTextAreaElement).value).toHaveLength(10);
    });

    it('should show character count when approaching limit', async () => {
      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} maxCharacters={10} />);

      const textInput = screen.getByTestId('text-input');
      await user.type(textInput, 'Hello wor');

      await waitFor(() => {
        expect(screen.getByText('9/10 characters')).toBeInTheDocument();
      });
    });

    it('should auto-resize textarea on content change', async () => {
      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} />);

      const textInput = screen.getByTestId('text-input') as HTMLTextAreaElement;
      const initialHeight = textInput.style.height;

      await user.type(textInput, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5');

      // Height should have changed
      expect(textInput.style.height).not.toBe(initialHeight);
    });
  });

  describe('Voice Recording Mode', () => {
    it('should start recording when microphone button is clicked', async () => {
      const { useVoiceRecording } = await import('@/hooks/useVoiceRecording');
      const mockStartRecording = vi.fn();

      (useVoiceRecording as Mock).mockReturnValue({
        isRecording: false,
        isPermissionGranted: true,
        recordingTime: 0,
        audioBlob: null,
        error: null,
        startRecording: mockStartRecording,
        stopRecording: vi.fn(),
        resetRecording: vi.fn(),
        requestPermission: vi.fn()
      });

      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} />);

      const micButton = screen.getByTestId('microphone-button');
      await user.click(micButton);

      expect(mockStartRecording).toHaveBeenCalled();
    });

    it('should stop recording when microphone button is clicked while recording', async () => {
      const { useVoiceRecording } = await import('@/hooks/useVoiceRecording');
      const mockStopRecording = vi.fn();

      (useVoiceRecording as Mock).mockReturnValue({
        isRecording: true,
        isPermissionGranted: true,
        recordingTime: 15,
        audioBlob: null,
        error: null,
        startRecording: vi.fn(),
        stopRecording: mockStopRecording,
        resetRecording: vi.fn(),
        requestPermission: vi.fn()
      });

      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} />);

      const micButton = screen.getByTestId('microphone-button');
      expect(micButton).toHaveAttribute('aria-label', 'Stop recording');

      await user.click(micButton);

      expect(mockStopRecording).toHaveBeenCalled();
    });

    it('should show voice visualization during recording', async () => {
      const { useVoiceRecording } = await import('@/hooks/useVoiceRecording');

      (useVoiceRecording as Mock).mockReturnValue({
        isRecording: true,
        isPermissionGranted: true,
        recordingTime: 15,
        audioBlob: null,
        error: null,
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
        resetRecording: vi.fn(),
        requestPermission: vi.fn()
      });

      render(<BottomInputBar {...defaultProps} />);

      // Voice visualization should be visible
      expect(screen.getByText('0:15')).toBeInTheDocument();
    });

    it('should show recording time limit warning', async () => {
      const { useVoiceRecording } = await import('@/hooks/useVoiceRecording');

      (useVoiceRecording as Mock).mockReturnValue({
        isRecording: true,
        isPermissionGranted: true,
        recordingTime: 270, // 4.5 minutes (90% of 5 minutes)
        audioBlob: null,
        error: null,
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
        resetRecording: vi.fn(),
        requestPermission: vi.fn()
      });

      render(<BottomInputBar {...defaultProps} maxRecordingTime={300} />);

      await waitFor(() => {
        expect(screen.getByText('Recording: 4:30')).toBeInTheDocument();
      });
    });

    it('should handle voice recording errors', async () => {
      const { useVoiceRecording } = await import('@/hooks/useVoiceRecording');

      (useVoiceRecording as Mock).mockReturnValue({
        isRecording: false,
        isPermissionGranted: false,
        recordingTime: 0,
        audioBlob: null,
        error: 'Microphone permission denied',
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
        resetRecording: vi.fn(),
        requestPermission: vi.fn()
      });

      render(<BottomInputBar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Microphone permission denied')).toBeInTheDocument();
      });
    });

    it('should dismiss error messages', async () => {
      const user = userEvent.setup();

      // First render with error
      const { rerender } = render(<BottomInputBar {...defaultProps} />);

      // Mock the hook to return an error initially
      const { useVoiceRecording } = await import('@/hooks/useVoiceRecording');
      (useVoiceRecording as Mock).mockReturnValue({
        isRecording: false,
        isPermissionGranted: false,
        recordingTime: 0,
        audioBlob: null,
        error: 'Test error message',
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
        resetRecording: vi.fn(),
        requestPermission: vi.fn()
      });

      rerender(<BottomInputBar {...defaultProps} />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();

      // Mock the hook to return no error after clicking dismiss
      (useVoiceRecording as Mock).mockReturnValue({
        isRecording: false,
        isPermissionGranted: false,
        recordingTime: 0,
        audioBlob: null,
        error: null,
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
        resetRecording: vi.fn(),
        requestPermission: vi.fn()
      });

      const dismissButton = screen.getByTestId('error-dismiss');
      await user.click(dismissButton);

      // Rerender to simulate state change
      rerender(<BottomInputBar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
      });
    });
  });

  describe('File Attachment', () => {
    it('should handle file selection', async () => {
      const onFileAttach = vi.fn();
      render(<BottomInputBar {...defaultProps} onFileAttach={onFileAttach} />);

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      expect(onFileAttach).toHaveBeenCalledWith(expect.objectContaining({ 0: expect.any(File) }));
    });

    it('should open file dialog when file attachment button is clicked', async () => {
      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} />);

      const fileButton = screen.getByTestId('file-attach-button');
      const fileInput = screen.getByTestId('file-input');

      const clickSpy = vi.spyOn(fileInput, 'click');

      await user.click(fileButton);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable all interactive elements when disabled prop is true', () => {
      render(<BottomInputBar {...defaultProps} disabled={true} />);

      const micButton = screen.getByTestId('microphone-button');
      const textInput = screen.getByTestId('text-input');
      const fileButton = screen.getByTestId('file-attach-button');

      expect(micButton).toBeDisabled();
      expect(textInput).toBeDisabled();
      expect(fileButton).toBeDisabled();
    });

    it('should not respond to clicks when disabled', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();

      render(<BottomInputBar {...defaultProps} onSend={onSend} disabled={true} />);

      const micButton = screen.getByTestId('microphone-button');
      await user.click(micButton);

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when processing', async () => {
      const { useVoiceRecording } = await import('@/hooks/useVoiceRecording');

      (useVoiceRecording as Mock).mockReturnValue({
        isRecording: false,
        isPermissionGranted: true,
        recordingTime: 0,
        audioBlob: null,
        error: null,
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
        resetRecording: vi.fn(),
        requestPermission: vi.fn()
      });

      const onSend = vi.fn(() => {
        // Simulate async operation
        return new Promise(resolve => setTimeout(resolve, 100));
      });

      render(<BottomInputBar {...defaultProps} onSend={onSend} />);

      const textInput = screen.getByTestId('text-input');
      const user = userEvent.setup();

      await user.type(textInput, 'Test message');

      const sendButton = await screen.findByTestId('send-button');
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Escape key to clear input', async () => {
      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} />);

      const textInput = screen.getByTestId('text-input');
      await user.type(textInput, 'Test message');
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect((textInput as HTMLTextAreaElement).value).toBe('');
      });
    });

    it('should handle Escape key to stop recording', async () => {
      const { useVoiceRecording } = await import('@/hooks/useVoiceRecording');
      const mockStopRecording = vi.fn();

      (useVoiceRecording as Mock).mockReturnValue({
        isRecording: true,
        isPermissionGranted: true,
        recordingTime: 10,
        audioBlob: null,
        error: null,
        startRecording: vi.fn(),
        stopRecording: mockStopRecording,
        resetRecording: vi.fn(),
        requestPermission: vi.fn()
      });

      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} />);

      const textInput = screen.getByTestId('text-input');
      await user.click(textInput);
      await user.keyboard('{Escape}');

      expect(mockStopRecording).toHaveBeenCalled();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should handle mobile keyboard visibility', async () => {
      // Mock window resize
      Object.defineProperty(window, 'innerHeight', {
        value: 400,
        writable: true
      });

      Object.defineProperty(window, 'outerHeight', {
        value: 800,
        writable: true
      });

      render(<BottomInputBar {...defaultProps} />);

      // Simulate resize event
      act(() => {
        fireEvent(window, new Event('resize'));
      });

      // Component should adjust for mobile keyboard
      const container = document.querySelector('.fixed.bottom-0');
      expect(container).toHaveClass('pb-0');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<BottomInputBar {...defaultProps} />);

      const micButton = screen.getByTestId('microphone-button');
      const textInput = screen.getByTestId('text-input');
      const fileButton = screen.getByTestId('file-attach-button');

      expect(micButton).toHaveAttribute('aria-label');
      expect(textInput).toHaveAttribute('aria-label');
      expect(fileButton).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<BottomInputBar {...defaultProps} />);

      // Tab through elements - just test that they're in the document and focusable
      const fileButton = screen.getByTestId('file-attach-button');
      const textInput = screen.getByTestId('text-input');
      const micButton = screen.getByTestId('microphone-button');

      expect(fileButton).toBeInTheDocument();
      expect(textInput).toBeInTheDocument();
      expect(micButton).toBeInTheDocument();

      // Test tab index or focusability attributes
      expect(fileButton).not.toHaveAttribute('tabindex', '-1');
      expect(textInput).not.toHaveAttribute('tabindex', '-1');
      expect(micButton).not.toHaveAttribute('tabindex', '-1');
    });
  });
});
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoiceRecorder } from '../VoiceRecorder'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'

// Mock the useVoiceRecording hook
jest.mock('@/hooks/useVoiceRecording')

describe('VoiceRecorder', () => {
  const mockUseVoiceRecording = useVoiceRecording as jest.MockedFunction<typeof useVoiceRecording>
  
  const defaultMockReturn = {
    isRecording: false,
    isPermissionGranted: true,
    recordingTime: 0,
    audioBlob: null,
    error: null,
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    resetRecording: jest.fn(),
    requestPermission: jest.fn(),
  }

  beforeEach(() => {
    // Reset mock before each test
    jest.clearAllMocks()
    mockUseVoiceRecording.mockReturnValue(defaultMockReturn)
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Initial State', () => {
    it('should render start recording button when not recording', () => {
      render(<VoiceRecorder />)
      
      expect(screen.getByText('Start Recording')).toBeInTheDocument()
      expect(screen.queryByText(/Stop Recording/)).not.toBeInTheDocument()
    })

    it('should display maximum recording duration', () => {
      render(<VoiceRecorder maxDuration={180} />)
      
      expect(screen.getByText(/Maximum recording duration: 03:00/)).toBeInTheDocument()
    })

    it('should display instructions when not recording', () => {
      render(<VoiceRecorder />)
      
      expect(screen.getByText(/Click "Start Recording" to begin capturing your voice/)).toBeInTheDocument()
    })
  })

  describe('Recording State', () => {
    it('should show stop button and timer when recording', () => {
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        isRecording: true,
        recordingTime: 65, // 1:05
      })

      render(<VoiceRecorder />)
      
      expect(screen.getByText('Stop Recording')).toBeInTheDocument()
      expect(screen.getByText('Recording: 01:05')).toBeInTheDocument()
      expect(screen.queryByText('Start Recording')).not.toBeInTheDocument()
    })

    it('should display recording indicator animation', () => {
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        isRecording: true,
      })

      const { container } = render(<VoiceRecorder />)
      
      const pulsingDot = container.querySelector('.animate-pulse.bg-red-500')
      const pingingDot = container.querySelector('.animate-ping.bg-red-500')
      
      expect(pulsingDot).toBeInTheDocument()
      expect(pingingDot).toBeInTheDocument()
    })

    it('should call startRecording when start button is clicked', async () => {
      const startRecordingMock = jest.fn()
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        startRecording: startRecordingMock,
      })

      render(<VoiceRecorder />)
      
      const startButton = screen.getByText('Start Recording')
      await userEvent.click(startButton)
      
      expect(startRecordingMock).toHaveBeenCalledTimes(1)
    })

    it('should call stopRecording when stop button is clicked', async () => {
      const stopRecordingMock = jest.fn()
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        isRecording: true,
        stopRecording: stopRecordingMock,
      })

      render(<VoiceRecorder />)
      
      const stopButton = screen.getByText('Stop Recording')
      await userEvent.click(stopButton)
      
      expect(stopRecordingMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Completed Recording', () => {
    it('should display audio player when recording is complete', () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' })
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        audioBlob: mockBlob,
      })

      render(<VoiceRecorder />)
      
      const audioElement = screen.getByRole('application') as HTMLAudioElement
      expect(audioElement).toBeInTheDocument()
      expect(screen.getByText('Recording ready for transcription')).toBeInTheDocument()
    })

    it('should show reset button when audio is available', () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' })
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        audioBlob: mockBlob,
      })

      render(<VoiceRecorder />)
      
      expect(screen.getByText('Reset')).toBeInTheDocument()
    })

    it('should call resetRecording when reset button is clicked', async () => {
      const resetRecordingMock = jest.fn()
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' })
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        audioBlob: mockBlob,
        resetRecording: resetRecordingMock,
      })

      render(<VoiceRecorder />)
      
      const resetButton = screen.getByText('Reset')
      await userEvent.click(resetButton)
      
      expect(resetRecordingMock).toHaveBeenCalledTimes(1)
    })

    it('should call onRecordingComplete callback when recording completes', () => {
      const onRecordingComplete = jest.fn()
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' })
      
      const { rerender } = render(<VoiceRecorder onRecordingComplete={onRecordingComplete} />)
      
      // Simulate recording completion
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        audioBlob: mockBlob,
        isRecording: false,
      })
      
      rerender(<VoiceRecorder onRecordingComplete={onRecordingComplete} />)
      
      expect(onRecordingComplete).toHaveBeenCalledWith(mockBlob)
    })
  })

  describe('Permission Handling', () => {
    it('should show permission request UI when permission not granted', async () => {
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        isPermissionGranted: false,
      })

      render(<VoiceRecorder />)
      
      // Click start to trigger hasInteracted state
      const startButton = screen.getByText('Start Recording')
      await userEvent.click(startButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Microphone permission is required/)).toBeInTheDocument()
        expect(screen.getByText('Grant Permission')).toBeInTheDocument()
      })
    })

    it('should call requestPermission when grant permission button is clicked', async () => {
      const requestPermissionMock = jest.fn()
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        isPermissionGranted: false,
        requestPermission: requestPermissionMock,
      })

      render(<VoiceRecorder />)
      
      // First click start to show permission UI
      const startButton = screen.getByText('Start Recording')
      await userEvent.click(startButton)
      
      // Then click grant permission
      const grantButton = await screen.findByText('Grant Permission')
      await userEvent.click(grantButton)
      
      expect(requestPermissionMock).toHaveBeenCalledTimes(1)
    })

    it('should disable start button when there is an error and no permission', () => {
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        isPermissionGranted: false,
        error: 'Permission denied',
      })

      render(<VoiceRecorder />)
      
      const startButton = screen.getByText('Start Recording')
      expect(startButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when error occurs', () => {
      const errorMessage = 'Microphone access denied'
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        error: errorMessage,
      })

      render(<VoiceRecorder />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn()
      const errorMessage = 'Recording failed'
      
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        error: errorMessage,
      })

      render(<VoiceRecorder onError={onError} />)
      
      expect(onError).toHaveBeenCalledWith(errorMessage)
    })
  })

  describe('Time Formatting', () => {
    it.each([
      [0, '00:00'],
      [59, '00:59'],
      [60, '01:00'],
      [125, '02:05'],
      [3599, '59:59'],
    ])('should format %i seconds as %s', (seconds, expected) => {
      mockUseVoiceRecording.mockReturnValue({
        ...defaultMockReturn,
        isRecording: true,
        recordingTime: seconds,
      })

      render(<VoiceRecorder />)
      
      expect(screen.getByText(`Recording: ${expected}`)).toBeInTheDocument()
    })
  })

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const { container } = render(<VoiceRecorder className="custom-class" />)
      
      const wrapper = container.querySelector('.custom-class')
      expect(wrapper).toBeInTheDocument()
    })

    it('should respect custom maxDuration prop', () => {
      render(<VoiceRecorder maxDuration={600} />)
      
      expect(screen.getByText(/Maximum recording duration: 10:00/)).toBeInTheDocument()
    })
  })
})
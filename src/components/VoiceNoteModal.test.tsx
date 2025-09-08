import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoiceNoteModal from './VoiceNoteModal'
import { useAuth } from '@clerk/nextjs'

// Mock the useAuth hook
vi.mock('@clerk/nextjs')

// Mock the VoiceRecorder component
vi.mock('./VoiceRecorder', () => ({
  VoiceRecorder: ({ onRecordingComplete, onError }: any) => (
    <div data-testid="voice-recorder">
      <button onClick={() => onRecordingComplete(new Blob())}>Complete Recording</button>
      <button onClick={() => onError('Test error')}>Trigger Error</button>
    </div>
  ),
}))

// Mock the FileUpload component
vi.mock('./FileUpload', () => ({
  FileUpload: ({ onFileSelect }: any) => (
    <div data-testid="file-upload">
      <button onClick={() => onFileSelect([new File(['test'], 'test.txt')])}>Select File</button>
    </div>
  ),
}))

describe('VoiceNoteModal', () => {
  const mockOnClose = vi.fn()
  const mockOnNoteCreated = vi.fn()
  const mockUseAuth = useAuth as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ userId: 'test-user-id' })
    
    // Mock fetch globally
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(
        <VoiceNoteModal
          isOpen={false}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      expect(screen.queryByText('Create New Note')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(
        <VoiceNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      expect(screen.getByText('Create New Note')).toBeInTheDocument()
    })
  })

  describe('Mode Switching', () => {
    it('should default to voice mode', () => {
      render(
        <VoiceNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      const voiceButton = screen.getByText('Voice Note')
      expect(voiceButton).toHaveClass('bg-blue-600', 'text-white')
      expect(screen.getByTestId('voice-recorder')).toBeInTheDocument()
    })

    it('should switch to text mode when text button is clicked', async () => {
      render(
        <VoiceNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      const textButton = screen.getByText('Text Note')
      await userEvent.click(textButton)
      
      expect(textButton).toHaveClass('bg-blue-600', 'text-white')
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should switch to file mode when upload button is clicked', async () => {
      render(
        <VoiceNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      const fileButton = screen.getByText('Upload File')
      await userEvent.click(fileButton)
      
      expect(fileButton).toHaveClass('bg-blue-600', 'text-white')
      expect(screen.getByTestId('file-upload')).toBeInTheDocument()
    })
  })

  describe('Text Mode', () => {
    beforeEach(() => {
      render(
        <VoiceNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      // Switch to text mode
      const textButton = screen.getByText('Text Note')
      userEvent.click(textButton)
    })

    it('should render textarea with proper styling for text visibility', async () => {
      const textButton = screen.getByText('Text Note')
      await userEvent.click(textButton)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveClass('text-gray-900')
      expect(textarea).toHaveAttribute('placeholder', 'Type or paste your note here...')
    })

    it('should update character count when typing', async () => {
      const textButton = screen.getByText('Text Note')
      await userEvent.click(textButton)
      
      const textarea = screen.getByRole('textbox')
      await userEvent.type(textarea, 'Hello world')
      
      expect(screen.getByText('11 characters')).toBeInTheDocument()
    })

    it('should enable save button when text is entered', async () => {
      const textButton = screen.getByText('Text Note')
      await userEvent.click(textButton)
      
      const textarea = screen.getByRole('textbox')
      const saveButton = screen.getByText('Save Note')
      
      expect(saveButton).toBeDisabled()
      
      await userEvent.type(textarea, 'Test note content')
      
      expect(saveButton).not.toBeDisabled()
    })

    it('should handle text submission successfully', async () => {
      // Mock successful API responses
      const mockProcessResponse = {
        data: {
          processed_content: 'Processed content',
          title: 'Test Title',
          summary: 'Test summary',
          tags: ['tag1', 'tag2']
        }
      }
      
      const mockCreateResponse = {
        data: {
          id: '123',
          title: 'Test Title',
          processed_content: 'Processed content'
        }
      }
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProcessResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCreateResponse)
        })
      
      const textButton = screen.getByText('Text Note')
      await userEvent.click(textButton)
      
      const textarea = screen.getByRole('textbox')
      await userEvent.type(textarea, 'Test note content')
      
      const saveButton = screen.getByText('Save Note')
      await userEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockOnNoteCreated).toHaveBeenCalledWith(mockCreateResponse.data)
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('Modal Interactions', () => {
    it('should close modal when close button is clicked', async () => {
      render(
        <VoiceNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      const closeButton = screen.getByRole('button', { name: 'Close modal' })
      await userEvent.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should close modal when clicking overlay (not during processing)', async () => {
      const { container } = render(
        <VoiceNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      // Find the overlay - it's the outermost div with fixed positioning
      const overlay = container.querySelector('div[class*="fixed"][class*="inset-0"]')
      if (overlay) {
        fireEvent.click(overlay)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(
        <VoiceNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      // Trigger an error through the voice recorder mock
      const errorButton = screen.getByText('Trigger Error')
      fireEvent.click(errorButton)
      
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })
  })

  describe('State Reset', () => {
    it('should reset state when modal closes', () => {
      const { rerender } = render(
        <VoiceNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      // Switch to text mode and enter some text
      const textButton = screen.getByText('Text Note')
      userEvent.click(textButton)
      
      // Close modal
      rerender(
        <VoiceNoteModal
          isOpen={false}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      // Reopen modal
      rerender(
        <VoiceNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onNoteCreated={mockOnNoteCreated}
        />
      )
      
      // Should be back to voice mode
      const voiceButton = screen.getByText('Voice Note')
      expect(voiceButton).toHaveClass('bg-blue-600', 'text-white')
    })
  })
})
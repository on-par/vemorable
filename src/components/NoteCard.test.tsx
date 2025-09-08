import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteCard from './NoteCard'

// Mock fetch for delete operations
global.fetch = vi.fn()

describe('NoteCard', () => {
  const mockNote = {
    id: 'note-123',
    title: 'Test Note Title',
    summary: 'This is a test note summary that describes the content of the note.',
    tags: ['test', 'development', 'javascript'],
    created_at: '2024-01-15T10:30:00Z',
    processed_content: 'Full note content goes here...',
  }

  const mockHandlers = {
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    onFavorite: vi.fn(),
    onClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockClear()
  })

  describe('Rendering', () => {
    it('should render note title', () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      expect(screen.getByText('Test Note Title')).toBeInTheDocument()
    })

    it('should render note summary', () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      expect(screen.getByText(/This is a test note summary/)).toBeInTheDocument()
    })

    it('should render up to 3 tags', () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      expect(screen.getByText('test')).toBeInTheDocument()
      expect(screen.getByText('development')).toBeInTheDocument()
      expect(screen.getByText('javascript')).toBeInTheDocument()
    })

    it('should show tag overflow indicator when more than 3 tags', () => {
      const noteWithManyTags = {
        ...mockNote,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      }
      
      render(<NoteCard note={noteWithManyTags} {...mockHandlers} />)
      
      expect(screen.getByText('tag1')).toBeInTheDocument()
      expect(screen.getByText('tag2')).toBeInTheDocument()
      expect(screen.getByText('tag3')).toBeInTheDocument()
      expect(screen.getByText('+2')).toBeInTheDocument()
      expect(screen.queryByText('tag4')).not.toBeInTheDocument()
      expect(screen.queryByText('tag5')).not.toBeInTheDocument()
    })

    it('should format and display creation date', () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Date should be formatted, look for parts of the formatted date
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    })

    it('should not render tags section when no tags', () => {
      const noteWithoutTags = {
        ...mockNote,
        tags: [],
      }
      
      render(<NoteCard note={noteWithoutTags} {...mockHandlers} />)
      
      const tagElements = screen.queryAllByText(/tag/)
      expect(tagElements).toHaveLength(0)
    })

    it('should show favorite indicator when isFavorited is true', () => {
      const { container } = render(
        <NoteCard note={mockNote} {...mockHandlers} isFavorited={true} />
      )
      
      // Look for the favorite star icon
      const favoriteStars = container.querySelectorAll('.text-yellow-500.fill-current')
      expect(favoriteStars.length).toBeGreaterThan(0)
    })

    it('should not show favorite indicator when isFavorited is false', () => {
      const { container } = render(
        <NoteCard note={mockNote} {...mockHandlers} isFavorited={false} />
      )
      
      // Look for the favorite star icon (should only be in the dropdown, not as indicator)
      const favoriteIndicator = container.querySelector('.absolute.top-2.left-2 .text-yellow-500')
      expect(favoriteIndicator).not.toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      const card = screen.getByText('Test Note Title').closest('.bg-white')
      await userEvent.click(card!)
      
      expect(mockHandlers.onClick).toHaveBeenCalledWith(mockNote)
    })

    it('should show actions menu when actions button is clicked', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Favorite')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('should hide actions menu when clicking actions button again', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      const actionsButton = screen.getByLabelText('Note actions')
      
      // Open menu
      await userEvent.click(actionsButton)
      expect(screen.getByText('Edit')).toBeInTheDocument()
      
      // Close menu
      await userEvent.click(actionsButton)
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('should not trigger card onClick when actions button is clicked', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      
      expect(mockHandlers.onClick).not.toHaveBeenCalled()
    })
  })

  describe('Edit Action', () => {
    it('should call onEdit when edit button is clicked', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Open actions menu
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      
      // Click edit
      const editButton = screen.getByText('Edit')
      await userEvent.click(editButton)
      
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockNote)
    })

    it('should close actions menu after edit is clicked', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Open actions menu
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      
      // Click edit
      const editButton = screen.getByText('Edit')
      await userEvent.click(editButton)
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('should not trigger card onClick when edit is clicked', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Open actions menu
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      
      // Click edit
      const editButton = screen.getByText('Edit')
      await userEvent.click(editButton)
      
      expect(mockHandlers.onClick).not.toHaveBeenCalled()
    })
  })

  describe('Favorite Action', () => {
    it('should call onFavorite when favorite button is clicked', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Open actions menu
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      
      // Click favorite
      const favoriteButton = screen.getByText('Favorite')
      await userEvent.click(favoriteButton)
      
      expect(mockHandlers.onFavorite).toHaveBeenCalledWith('note-123')
    })

    it('should show "Unfavorite" text when already favorited', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} isFavorited={true} />)
      
      // Open actions menu
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      
      expect(screen.getByText('Unfavorite')).toBeInTheDocument()
      expect(screen.queryByText('Favorite')).not.toBeInTheDocument()
    })

    it('should show filled star icon when favorited', async () => {
      const { container } = render(
        <NoteCard note={mockNote} {...mockHandlers} isFavorited={true} />
      )
      
      // Open actions menu
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      
      // Check for filled star in the menu
      const favoriteButton = screen.getByText('Unfavorite').closest('button')
      const starIcon = favoriteButton?.querySelector('.text-yellow-500.fill-current')
      expect(starIcon).toBeInTheDocument()
    })
  })

  describe('Delete Action', () => {
    it('should show delete confirmation when delete button is clicked', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Open actions menu
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      
      // Click delete
      const deleteButton = screen.getByText('Delete')
      await userEvent.click(deleteButton)
      
      expect(screen.getByText('Delete this note?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('should hide delete confirmation when cancel is clicked', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Open actions menu and click delete
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      await userEvent.click(screen.getByText('Delete'))
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await userEvent.click(cancelButton)
      
      expect(screen.queryByText('Delete this note?')).not.toBeInTheDocument()
    })

    it('should call API and onDelete when confirmed', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Open actions menu and click delete
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      await userEvent.click(screen.getByText('Delete'))
      
      // Confirm delete
      const confirmButton = screen.getAllByText('Delete')[1] // Second delete button is the confirm
      await userEvent.click(confirmButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/notes/note-123', {
          method: 'DELETE',
        })
        expect(mockHandlers.onDelete).toHaveBeenCalledWith('note-123')
      })
    })

    it('should handle delete API error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))
      
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Open actions menu and click delete
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      await userEvent.click(screen.getByText('Delete'))
      
      // Confirm delete
      const confirmButton = screen.getAllByText('Delete')[1]
      await userEvent.click(confirmButton)
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete note:', expect.any(Error))
        expect(mockHandlers.onDelete).not.toHaveBeenCalled()
      })
      
      consoleErrorSpy.mockRestore()
    })

    it('should not call onDelete if API returns non-ok response', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Open actions menu and click delete
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      await userEvent.click(screen.getByText('Delete'))
      
      // Confirm delete
      const confirmButton = screen.getAllByText('Delete')[1]
      await userEvent.click(confirmButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
      
      expect(mockHandlers.onDelete).not.toHaveBeenCalled()
    })

    it('should not trigger card onClick when interacting with delete confirmation', async () => {
      render(<NoteCard note={mockNote} {...mockHandlers} />)
      
      // Open actions menu and click delete
      const actionsButton = screen.getByLabelText('Note actions')
      await userEvent.click(actionsButton)
      await userEvent.click(screen.getByText('Delete'))
      
      // Click on the confirmation overlay
      const confirmationOverlay = screen.getByText('Delete this note?').parentElement
      await userEvent.click(confirmationOverlay!)
      
      expect(mockHandlers.onClick).not.toHaveBeenCalled()
    })
  })

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const testDate = '2024-03-15T14:30:00Z'
      const noteWithDate = {
        ...mockNote,
        created_at: testDate,
      }
      
      render(<NoteCard note={noteWithDate} {...mockHandlers} />)
      
      // Check for formatted date parts
      const dateText = screen.getByText(/Mar 15, 2024/)
      expect(dateText).toBeInTheDocument()
    })

    it('should handle invalid dates gracefully', () => {
      const noteWithInvalidDate = {
        ...mockNote,
        created_at: 'invalid-date',
      }
      
      render(<NoteCard note={noteWithInvalidDate} {...mockHandlers} />)
      
      // Should still render without crashing
      expect(screen.getByText('Test Note Title')).toBeInTheDocument()
    })
  })
})
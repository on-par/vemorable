import { createServerClientInstance } from '@/lib/supabase'
import {
  handleApiError,
  getAuthenticatedUserId,
} from '@/lib/api-utils'
import { Database } from '@/types/database'

type Note = Database['public']['Tables']['notes']['Row']
type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
type ChatMessage = Database['public']['Tables']['chat_messages']['Row']

type ExportData = {
  exportDate: string
  version: string
  user: {
    id: string
  }
  notes: Note[]
  chatSessions: Array<{
    session: ChatSession
    messages: ChatMessage[]
  }>
  statistics: {
    totalNotes: number
    totalTags: number
    totalChatSessions: number
    totalChatMessages: number
    dateRange: {
      firstNote: string | null
      lastNote: string | null
    }
  }
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()

    // Fetch all user notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (notesError) {
      throw notesError
    }

    // Fetch all chat sessions
    const { data: chatSessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      throw sessionsError
    }

    // Type cast the results to ensure type safety
    const typedNotes = notes as Note[] | null
    const typedChatSessions = chatSessions as ChatSession[] | null

    // Fetch all chat messages for user's sessions
    const sessionIds = (typedChatSessions || []).map(s => s.id)
    let chatMessages: ChatMessage[] = []

    if (sessionIds.length > 0) {
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true })

      if (messagesError) {
        throw messagesError
      }
      chatMessages = (messages as ChatMessage[]) || []
    }

    // Group messages by session
    const sessionsWithMessages = (typedChatSessions || []).map(session => ({
      session,
      messages: chatMessages.filter(msg => msg.session_id === session.id)
    }))

    // Calculate statistics
    const allTags = new Set<string>()
    const notesArray = typedNotes || []
    notesArray.forEach(note => {
      note.tags?.forEach((tag: string) => allTags.add(tag))
    })

    const dateRange = notesArray.length > 0 
      ? {
          firstNote: notesArray[notesArray.length - 1].created_at,
          lastNote: notesArray[0].created_at
        }
      : {
          firstNote: null,
          lastNote: null
        }

    // Prepare export data
    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      user: {
        id: userId
      },
      notes: notesArray,
      chatSessions: sessionsWithMessages,
      statistics: {
        totalNotes: notesArray.length,
        totalTags: allTags.size,
        totalChatSessions: typedChatSessions?.length || 0,
        totalChatMessages: chatMessages.length,
        dateRange
      }
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `vemorable-export-${timestamp}.json`

    // Return JSON with download headers
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
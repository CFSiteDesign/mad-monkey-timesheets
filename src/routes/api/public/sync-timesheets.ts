import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sync-Secret',
}

export const Route = createFileRoute('/api/public/sync-timesheets')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request }) => {
        const provided =
          request.headers.get('x-sync-secret') ||
          request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
        const expected = process.env.SHEETS_SYNC_SECRET

        if (!expected || provided !== expected) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }

        const { data, error } = await supabaseAdmin
          .from('timesheets')
          .select('id, created_at, job_reference, file_link, tool_used, time_spent')
          .eq('synced_to_sheet', false)
          .order('created_at', { ascending: true })

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }

        if (data && data.length > 0) {
          const ids = data.map((r) => r.id)
          await supabaseAdmin
            .from('timesheets')
            .update({ synced_to_sheet: true })
            .in('id', ids)
        }

        return new Response(JSON.stringify({ entries: data ?? [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      },
    },
  },
})

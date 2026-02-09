export const runtime = 'edge';

export async function GET() {
    const envCheck = {
        status: 'ok',
        time: new Date().toISOString(),
        env: {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ NOT SET',
        }
    };

    return new Response(JSON.stringify(envCheck, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}

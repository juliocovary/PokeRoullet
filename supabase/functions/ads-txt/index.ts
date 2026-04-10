import "https://deno.land/x/xhr@0.1.0/mod.ts";

Deno.serve(async (req) => {
  // Redirect 301 to Ezoic ads.txt manager
  return new Response(null, {
    status: 301,
    headers: {
      "Location": "https://srv.adstxtmanager.com/19390/pokeroullet.fun",
      "Cache-Control": "public, max-age=86400",
    },
  });
});

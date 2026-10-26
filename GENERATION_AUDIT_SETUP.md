# Generation audit integration
The describe-image and generate-captions endpoints now attempt to log real requests to public.generation_requests and outputs to public.llm_responses. Requires admin SQL migration 002 and a server-only SUPABASE_SERVICE_ROLE_KEY in the main app environment. If not configured, generation still works but logging is skipped. Do not put the key in NEXT_PUBLIC_ variables.

from supabase import create_client, Client
import os
import httpx

# Configure httpx client for better connection pooling
# This will affect all httpx clients created afterwards, including those used by supabase-py
httpx.Client(limits=httpx.Limits(max_connections=100, max_keepalive_connections=20))

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

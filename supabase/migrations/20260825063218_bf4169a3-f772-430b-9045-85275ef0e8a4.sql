REVOKE ALL ON FUNCTION public.get_leaderboard() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.is_business_active(uuid) from public, anon, authenticated;
grant execute on function public.is_business_active(uuid) to anon, authenticated;

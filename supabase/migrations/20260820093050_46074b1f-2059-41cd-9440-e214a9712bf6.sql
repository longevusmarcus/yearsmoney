CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(display_name text, net_worth numeric, monthly_income numeric, monthly_expenses numeric, is_me boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    CASE
      WHEN p.leaderboard_display IN ('public', 'full') THEN
        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''),
          NULLIF(TRIM(p.nickname), ''),
          'Anonymous'
        )
      ELSE
        COALESCE(LEFT(NULLIF(TRIM(COALESCE(p.nickname, p.first_name, '')), ''), 3) || '...', 'Anon...')
    END AS display_name,
    f.net_worth,
    f.monthly_income,
    f.monthly_expenses,
    (f.user_id = auth.uid()) AS is_me
  FROM public.user_finances f
  LEFT JOIN public.profiles p ON p.id = f.user_id
  WHERE f.net_worth > 0 AND f.monthly_income > 0
  ORDER BY (f.net_worth / (f.monthly_income * 12)) DESC
  LIMIT 100;
$function$;
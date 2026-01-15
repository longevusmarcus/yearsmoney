-- Create investments table to store user portfolio
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_symbol TEXT,
  amount_invested NUMERIC NOT NULL,
  quantity NUMERIC,
  purchase_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own investments
CREATE POLICY "Users can view their own investments"
ON public.investments FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own investments
CREATE POLICY "Users can create their own investments"
ON public.investments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own investments
CREATE POLICY "Users can update their own investments"
ON public.investments FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own investments
CREATE POLICY "Users can delete their own investments"
ON public.investments FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updating updated_at
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster user queries
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
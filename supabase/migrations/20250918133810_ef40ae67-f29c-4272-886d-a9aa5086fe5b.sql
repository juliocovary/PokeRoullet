-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  birth_date DATE,
  pokecoins INTEGER NOT NULL DEFAULT 0,
  starter_pokemon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pokemon_inventory table
CREATE TABLE public.pokemon_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pokemon_id INTEGER NOT NULL,
  pokemon_name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pokemon_id)
);

-- Create user_spins table for free spins tracking
CREATE TABLE public.user_spins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  free_spins INTEGER NOT NULL DEFAULT 5,
  last_spin_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pokemon_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pokemon_inventory
CREATE POLICY "Users can view their own inventory" 
ON public.pokemon_inventory 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own inventory" 
ON public.pokemon_inventory 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for user_spins
CREATE POLICY "Users can view their own spins" 
ON public.user_spins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own spins" 
ON public.user_spins 
FOR ALL 
USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_spins_updated_at
BEFORE UPDATE ON public.user_spins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  -- Create profile entry
  INSERT INTO public.profiles (user_id, nickname)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'nickname', 'Trainer'));
  
  -- Create user_spins entry
  INSERT INTO public.user_spins (user_id, free_spins)
  VALUES (new.id, 5);
  
  RETURN new;
END;
$$;

-- Trigger to create profile and spins on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
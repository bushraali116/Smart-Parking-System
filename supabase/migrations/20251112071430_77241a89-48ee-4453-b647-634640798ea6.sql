-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for parking slot status
CREATE TYPE public.slot_status AS ENUM ('available', 'occupied', 'reserved');

-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  total_slots INTEGER NOT NULL DEFAULT 0,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create parking_slots table
CREATE TABLE public.parking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  slot_number TEXT NOT NULL,
  status slot_status NOT NULL DEFAULT 'available',
  floor INTEGER,
  section TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(location_id, slot_number)
);

ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slot_id UUID REFERENCES public.parking_slots(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_hours NUMERIC(5, 2) NOT NULL,
  total_cost NUMERIC(10, 2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  qr_code TEXT,
  vehicle_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for locations
CREATE POLICY "Anyone can view locations"
  ON public.locations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage locations"
  ON public.locations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for parking_slots
CREATE POLICY "Anyone can view parking slots"
  ON public.parking_slots FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage parking slots"
  ON public.parking_slots FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parking_slots_updated_at
  BEFORE UPDATE ON public.parking_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for bookings and parking_slots
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_slots;

-- Insert sample locations
INSERT INTO public.locations (name, address, city, latitude, longitude, total_slots, hourly_rate, image_url) VALUES
  ('Downtown Plaza', '123 Main Street', 'San Francisco', 37.7749, -122.4194, 100, 5.00, 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800'),
  ('Airport Parking', '456 Airport Blvd', 'San Francisco', 37.6213, -122.3790, 200, 8.00, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'),
  ('Shopping Mall', '789 Commerce Ave', 'San Francisco', 37.7849, -122.4094, 150, 3.00, 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800'),
  ('University Campus', '321 College Road', 'Berkeley', 37.8715, -122.2730, 300, 2.00, 'https://images.unsplash.com/photo-1562774053-701939374585?w=800');

-- Insert sample parking slots for each location
INSERT INTO public.parking_slots (location_id, slot_number, status, floor, section)
SELECT 
  l.id,
  'A' || gs::text,
  CASE WHEN random() > 0.7 THEN 'occupied'::slot_status ELSE 'available'::slot_status END,
  1,
  'A'
FROM public.locations l
CROSS JOIN generate_series(1, 25) gs;

INSERT INTO public.parking_slots (location_id, slot_number, status, floor, section)
SELECT 
  l.id,
  'B' || gs::text,
  CASE WHEN random() > 0.7 THEN 'occupied'::slot_status ELSE 'available'::slot_status END,
  1,
  'B'
FROM public.locations l
CROSS JOIN generate_series(1, 25) gs;

INSERT INTO public.parking_slots (location_id, slot_number, status, floor, section)
SELECT 
  l.id,
  'C' || gs::text,
  CASE WHEN random() > 0.7 THEN 'occupied'::slot_status ELSE 'available'::slot_status END,
  2,
  'C'
FROM public.locations l
CROSS JOIN generate_series(1, 25) gs;

INSERT INTO public.parking_slots (location_id, slot_number, status, floor, section)
SELECT 
  l.id,
  'D' || gs::text,
  CASE WHEN random() > 0.7 THEN 'occupied'::slot_status ELSE 'available'::slot_status END,
  2,
  'D'
FROM public.locations l
CROSS JOIN generate_series(1, 25) gs;

-- Update total_slots in locations based on actual slots created
UPDATE public.locations
SET total_slots = (
  SELECT COUNT(*)
  FROM public.parking_slots
  WHERE parking_slots.location_id = locations.id
);
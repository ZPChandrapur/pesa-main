/*
  # Authentication and Role-Based Access Control Setup

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text, unique) - role name like 'admin', 'bdo', 'ceo', 'gramsewak'
      - `description` (text) - role description
      - `permissions` (jsonb) - role permissions
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `role_id` (uuid, foreign key to roles)
      - `district` (text) - user's assigned district
      - `block` (text) - user's assigned block
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read their own data
    - Add policies for admins to manage roles and user assignments

  3. Initial Data
    - Insert default roles (admin, ceo, bdo, gramsewak)
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  district text,
  block text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
CREATE POLICY "Anyone can read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- RLS Policies for user_roles table
CREATE POLICY "Users can read their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'System Administrator', '{"all": true}'),
  ('ceo', 'Chief Executive Officer - District Level', '{"district": true, "taluka": true, "gramPanchayat": true, "villages": true}'),
  ('bdo', 'Block Development Officer - Block Level', '{"taluka": true, "gramPanchayat": true, "villages": true}'),
  ('gramsewak', 'Gram Sewak - Village Level', '{"gramPanchayat": true, "villages": true}')
ON CONFLICT (name) DO NOTHING;

-- Create function to get user role and permissions
CREATE OR REPLACE FUNCTION get_user_role_info(user_uuid uuid)
RETURNS TABLE (
  role_name text,
  role_description text,
  permissions jsonb,
  district text,
  block text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.name,
    r.description,
    r.permissions,
    ur.district,
    ur.block
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_uuid
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
  user_email text,
  role_name text,
  user_district text DEFAULT NULL,
  user_block text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  user_uuid uuid;
  role_uuid uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Get role ID from name
  SELECT id INTO role_uuid FROM roles WHERE name = role_name;
  IF role_uuid IS NULL THEN
    RAISE EXCEPTION 'Role % not found', role_name;
  END IF;

  -- Insert or update user role
  INSERT INTO user_roles (user_id, role_id, district, block)
  VALUES (user_uuid, role_uuid, user_district, user_block)
  ON CONFLICT (user_id, role_id) 
  DO UPDATE SET 
    district = EXCLUDED.district,
    block = EXCLUDED.block,
    updated_at = now();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
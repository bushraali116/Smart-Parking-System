import { supabase } from "@/integrations/supabase/client";

export { supabase };

export const checkUserRole = async (userId: string, role: 'admin' | 'user'): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('has_role', { _user_id: userId, _role: role });
  
  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }
  
  return data || false;
};

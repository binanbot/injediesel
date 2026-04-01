
CREATE OR REPLACE FUNCTION public.safe_delete_customer(_customer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _vehicles_count int;
  _files_count int;
  _services_count int;
  _unit_id uuid;
  _user_unit_id uuid;
BEGIN
  -- Check ownership via unit
  SELECT unit_id INTO _unit_id FROM public.customers WHERE id = _customer_id;
  IF _unit_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Cliente não encontrado');
  END IF;

  _user_unit_id := public.get_user_unit_id(auth.uid());
  
  -- Allow if franchisee owns the unit OR is admin
  IF _user_unit_id != _unit_id AND NOT public.is_franchisor_admin(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Sem permissão');
  END IF;

  -- Count bindings
  SELECT count(*) INTO _vehicles_count FROM public.vehicles WHERE customer_id = _customer_id;
  SELECT count(*) INTO _files_count FROM public.received_files WHERE customer_id = _customer_id;
  SELECT count(*) INTO _services_count FROM public.services WHERE customer_id = _customer_id;

  IF (_vehicles_count + _files_count + _services_count) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'Cliente possui vínculos',
      'vehicles', _vehicles_count,
      'files', _files_count,
      'services', _services_count
    );
  END IF;

  DELETE FROM public.customers WHERE id = _customer_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

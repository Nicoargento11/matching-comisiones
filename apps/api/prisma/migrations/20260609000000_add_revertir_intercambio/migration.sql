-- revertir_intercambio: revierte un swap de comisiones atómicamente
-- Usado como compensación cuando falla la generación del comprobante.
CREATE OR REPLACE FUNCTION revertir_intercambio(
  p_id_intercambio INT,
  p_id_estado_pendiente INT,
  p_id_usuario_ofrece INT,
  p_id_comision_ofrece INT,
  p_id_usuario_destino INT,
  p_id_comision_destino INT
) RETURNS VOID AS $$
BEGIN
  -- 1. Revertir estado del intercambio a PENDIENTE
  UPDATE intercambio
  SET id_estado = p_id_estado_pendiente
  WHERE id_intercambio = p_id_intercambio;

  -- 2. Dar de baja la nueva inscripción del que ofrece (en comisión destino)
  UPDATE usuario_comision
  SET estado = 'BAJA'
  WHERE id_usuario = p_id_usuario_ofrece
    AND id_comision = p_id_comision_destino;

  -- 3. Reactivar inscripción original del que ofrece (en comisión origen)
  UPDATE usuario_comision
  SET estado = 'ACTIVO'
  WHERE id_usuario = p_id_usuario_ofrece
    AND id_comision = p_id_comision_ofrece;

  -- 4. Dar de baja la nueva inscripción del que recibe (en comisión origen)
  UPDATE usuario_comision
  SET estado = 'BAJA'
  WHERE id_usuario = p_id_usuario_destino
    AND id_comision = p_id_comision_ofrece;

  -- 5. Reactivar inscripción original del que recibe (en comisión destino)
  UPDATE usuario_comision
  SET estado = 'ACTIVO'
  WHERE id_usuario = p_id_usuario_destino
    AND id_comision = p_id_comision_destino;
END;
$$ LANGUAGE plpgsql;

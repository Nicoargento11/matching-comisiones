-- ============================================================================
-- Stored Procedures: lógica de negocio transaccional
-- ============================================================================

-- ----------------------------------------------------------------------------
-- completar_intercambio: swap atómico de comisiones entre dos alumnos
--
-- Reemplaza la lógica que antes ejecutaba `PrismaIntercambiosRepository`
-- con 7+ operaciones dentro de un `$transaction` de Prisma.
--
-- Qué hace:
--   1. Cambia el estado del intercambio a COMPLETADO
--   2. Da de baja (BAJA) al alumno que ofrece en su comisión original
--   3. Activa/crea la inscripción del alumno que ofrece en la comisión destino
--   4. Da de baja (BAJA) al alumno destino en su comisión original
--   5. Activa/crea la inscripción del alumno destino en la comisión origen
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION completar_intercambio(
  p_id_intercambio INT,
  p_id_estado_completado INT,
  p_id_usuario_ofrece INT,
  p_id_comision_ofrece INT,
  p_id_usuario_destino INT,
  p_id_comision_destino INT
) RETURNS VOID AS $$
BEGIN
  -- 1. Cambiar estado del intercambio a COMPLETADO
  UPDATE intercambio
  SET id_estado = p_id_estado_completado
  WHERE id_intercambio = p_id_intercambio;

  -- 2. Dar de baja al que ofrece en su comisión original
  UPDATE usuario_comision
  SET estado = 'BAJA'
  WHERE id_usuario = p_id_usuario_ofrece
    AND id_comision = p_id_comision_ofrece;

  -- 3. Swap: el que ofrece entra en la comisión destino
  IF EXISTS (
    SELECT 1 FROM usuario_comision
    WHERE id_usuario = p_id_usuario_ofrece
      AND id_comision = p_id_comision_destino
  ) THEN
    UPDATE usuario_comision
    SET estado = 'ACTIVO'
    WHERE id_usuario = p_id_usuario_ofrece
      AND id_comision = p_id_comision_destino;
  ELSE
    INSERT INTO usuario_comision (id_usuario, id_comision, estado)
    VALUES (p_id_usuario_ofrece, p_id_comision_destino, 'ACTIVO');
  END IF;

  -- 4. Dar de baja al que recibe en su comisión original
  UPDATE usuario_comision
  SET estado = 'BAJA'
  WHERE id_usuario = p_id_usuario_destino
    AND id_comision = p_id_comision_destino;

  -- 5. Swap: el que recibe entra en la comisión origen
  IF EXISTS (
    SELECT 1 FROM usuario_comision
    WHERE id_usuario = p_id_usuario_destino
      AND id_comision = p_id_comision_ofrece
  ) THEN
    UPDATE usuario_comision
    SET estado = 'ACTIVO'
    WHERE id_usuario = p_id_usuario_destino
      AND id_comision = p_id_comision_ofrece;
  ELSE
    INSERT INTO usuario_comision (id_usuario, id_comision, estado)
    VALUES (p_id_usuario_destino, p_id_comision_ofrece, 'ACTIVO');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- dar_baja_inscripcion: baja de una inscripción + rechazo de intercambios
--                        pendientes asociados
--
-- Reemplaza la lógica que antes ejecutaba `PrismaComisionesRepository`
-- con 4 operaciones dentro de un `$transaction` de Prisma.
--
-- Qué hace:
--   1. Cambia el estado de la inscripción a BAJA
--   2. Rechaza todos los intercambios PENDIENTES que involucren esa inscripción
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION dar_baja_inscripcion(
  p_id_usuario INT,
  p_id_comision INT
) RETURNS VOID AS $$
DECLARE
  v_id_estado_rechazado INT;
  v_id_estado_pendiente INT;
BEGIN
  -- 1. Dar de baja la inscripción
  UPDATE usuario_comision
  SET estado = 'BAJA'
  WHERE id_usuario = p_id_usuario
    AND id_comision = p_id_comision;

  -- 2. Buscar IDs de estados para rechazar pendientes
  SELECT id_estado INTO v_id_estado_rechazado
  FROM estado WHERE nombre_estado = 'RECHAZADO';

  SELECT id_estado INTO v_id_estado_pendiente
  FROM estado WHERE nombre_estado = 'PENDIENTE';

  -- 3. Rechazar intercambios pendientes que involucren esta inscripción
  IF v_id_estado_pendiente IS NOT NULL AND v_id_estado_rechazado IS NOT NULL THEN
    UPDATE intercambio
    SET id_estado = v_id_estado_rechazado
    WHERE id_estado = v_id_estado_pendiente
      AND (
        (id_usuario_ofrece = p_id_usuario AND id_comision_ofrece = p_id_comision)
        OR
        (id_usuario_destino = p_id_usuario AND id_comision_destino = p_id_comision)
      );
  END IF;
END;
$$ LANGUAGE plpgsql;

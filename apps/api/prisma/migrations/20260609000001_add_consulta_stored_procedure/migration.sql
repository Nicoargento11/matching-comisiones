-- ============================================================================
-- consultar_alumnos_comision: función de consulta (read-only) que retorna
-- los alumnos activos de una comisión con sus datos personales.
--
-- Demuestra el uso de funciones SELECT en PostgreSQL como complemento
-- a los stored procedures de escritura (completar_intercambio,
-- dar_baja_inscripcion, revertir_intercambio).
-- ============================================================================
CREATE OR REPLACE FUNCTION consultar_alumnos_comision(
  p_id_comision INT
) RETURNS TABLE(
  id_usuario INT,
  dni INT,
  nombre_usuario TEXT,
  apellido_usuario TEXT,
  correo TEXT,
  estado TEXT
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      u.id_usuario,
      u.dni,
      u.nombre_usuario,
      u.apellido_usuario,
      u.correo,
      uc.estado::TEXT
    FROM usuario_comision uc
    INNER JOIN usuario u ON u.id_usuario = uc.id_usuario
    WHERE uc.id_comision = p_id_comision
      AND uc.estado = 'ACTIVO'
    ORDER BY u.apellido_usuario, u.nombre_usuario;
END;
$$ LANGUAGE plpgsql STABLE;

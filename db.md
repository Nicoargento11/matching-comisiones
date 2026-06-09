## Table `_prisma_migrations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `varchar` | Primary |
| `checksum` | `varchar` |  |
| `finished_at` | `timestamptz` |  Nullable |
| `migration_name` | `varchar` |  |
| `logs` | `text` |  Nullable |
| `rolled_back_at` | `timestamptz` |  Nullable |
| `started_at` | `timestamptz` |  |
| `applied_steps_count` | `int4` |  |

## Table `carrera`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_carrera` | `int4` | Primary |
| `nombre_carrera` | `text` |  |
| `id_facultad` | `int4` |  |

## Table `usuario`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_usuario` | `int4` | Primary |
| `dni` | `int4` |  |
| `nombre_usuario` | `text` |  |
| `apellido_usuario` | `text` |  |
| `correo` | `text` |  |
| `activo` | `bool` |  |
| `fecha_registro` | `timestamp` |  |
| `supabase_auth_id` | `uuid` |  Nullable |

## Table `rol`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_rol` | `int4` | Primary |
| `nombre_rol` | `text` |  |

## Table `rol_usuario`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_usuario` | `int4` | Primary |
| `id_rol` | `int4` | Primary |

## Table `facultad`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_facultad` | `int4` | Primary |
| `nombre_facultad` | `text` |  |

## Table `materia`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_materia` | `int4` | Primary |
| `nombre_materia` | `text` |  |
| `id_carrera` | `int4` |  |
| `color` | `text` |  |

## Table `comision`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_comision` | `int4` | Primary |
| `numero_comision` | `int4` |  Nullable |
| `nombre_comision` | `text` |  Nullable |
| `cupo_maximo` | `int4` |  |
| `id_materia` | `int4` |  |
| `fecha_fin` | `timestamp` |  Nullable |
| `id_usuario_profesor` | `int4` |  |

## Table `usuario_comision`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_usuario` | `int4` | Primary |
| `id_comision` | `int4` | Primary |
| `estado` | `EstadoInscripcion` |  |

## Table `estado`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_estado` | `int4` | Primary |
| `nombre_estado` | `text` |  |

## Table `intercambio`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_intercambio` | `int4` | Primary |
| `fecha_solicitud` | `timestamp` |  |
| `id_estado` | `int4` |  |
| `id_usuario_ofrece` | `int4` |  |
| `id_comision_ofrece` | `int4` |  |
| `id_usuario_destino` | `int4` |  |
| `id_comision_destino` | `int4` |  |

## Table `dia`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `numero_dia` | `int4` | Primary |
| `nombre_dia` | `text` |  |

## Table `modalidad`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_modalidad` | `int4` | Primary |
| `nombre_modalidad` | `text` |  |

## Table `horario_comision`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_horario_comision` | `int4` | Primary |
| `hora_inicio` | `text` |  |
| `hora_fin` | `text` |  |
| `id_comision` | `int4` |  |
| `numero_dia` | `int4` |  |
| `id_modalidad` | `int4` |  |
| `id_aula` | `int4` |  Nullable |
| `formato` | `FormatoClase` |  |
| `activo` | `bool` |  |

## Table `comprobante`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_comprobante` | `int4` | Primary |
| `fecha_generacion` | `timestamp` |  |
| `archivo_pdf_url` | `text` |  |
| `id_intercambio` | `int4` |  |

## Table `notificacion`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_notificacion` | `int4` | Primary |
| `tipo` | `TipoNotificacion` |  |
| `mensaje` | `text` |  |
| `leida` | `bool` |  |
| `id_usuario` | `int4` |  |
| `creada_en` | `timestamp` |  |
| `datos` | `jsonb` |  Nullable |
| `titulo` | `text` |  |

## Table `evento`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_evento` | `int4` | Primary |
| `titulo` | `text` |  |
| `descripcion` | `text` |  Nullable |
| `tipo_evento` | `TipoEvento` |  |
| `fecha_inicio` | `timestamp` |  |
| `fecha_fin` | `timestamp` |  |
| `origen` | `OrigenEvento` |  |
| `id_usuario` | `int4` |  |
| `id_materia` | `int4` |  |
| `id_comision` | `int4` |  |
| `activo` | `bool` |  |

## Table `columna_tablero`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_columna` | `int4` | Primary |
| `nombre` | `text` |  |
| `orden_columna` | `int4` |  |
| `id_usuario` | `int4` |  Nullable |

## Table `tarea`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_tarea` | `int4` | Primary |
| `titulo` | `text` |  |
| `descripcion` | `text` |  Nullable |
| `prioridad` | `PrioridadTarea` |  |
| `fecha_vencimiento` | `timestamp` |  Nullable |
| `estimacion_min` | `int4` |  Nullable |
| `id_usuario` | `int4` |  |
| `id_columna` | `int4` |  |
| `id_evento` | `int4` |  Nullable |
| `id_materia` | `int4` |  Nullable |

## Table `conversacion`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_conversacion` | `int4` | Primary |
| `creada_en` | `timestamp` |  |

## Table `conversacion_participante`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_conversacion` | `int4` | Primary |
| `id_usuario` | `int4` | Primary |
| `ultimo_leido` | `timestamp` |  Nullable |

## Table `mensaje`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_mensaje` | `int4` | Primary |
| `contenido` | `text` |  |
| `creado_en` | `timestamp` |  |
| `id_conversacion` | `int4` |  |
| `id_usuario_emisor` | `int4` |  |

## Table `aula`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_aula` | `int4` | Primary |
| `nombre` | `text` |  |
| `capacidad` | `int4` |  Nullable |


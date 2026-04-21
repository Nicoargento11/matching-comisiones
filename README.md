# Sistema de Matching de Comisiones Universidad

## 📋 Scope Definido por el Equipo

### Historias de Usuario (6)

| ID | Historia | Prioridad | Estimación |
|----|----------|-----------|------------|
| US-01 | Registro con DNI, nombre, correo, contraseña | Alta | 3 días |
| US-02 | Login | Alta | 2 días |
| US-03 | Visualización de agenda y calendario | Media | 5 días |
| US-04 | Solicitud de cambio de comisión (matching) | Alta | 6 días |
| US-05 | Generación de comprobante PDF | Media | 7 días |
| US-06 | Notificación de match por correo | Media | 7 días |

**Total**: ~30 días (6 semanas)

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [📋 Propuesta](docs/00-propuesta.md) | Alcance, timeline 6 semanas |
| [📋 Especificaciones](docs/01-especificaciones.md) | 6 US, RF, RNF, Casos de Uso |
| [🏗️ Diseño Técnico](docs/02-diseno-tecnico.md) | **3 Diagramas Secuencia**, **2 Contratos**, Arquitectura |
| [✅ Plan de Tareas](docs/03-plan-de-tareas.md) | WBS 6 semanas |
| [🔄 Metodología](docs/04-metodologia.md) | Agile/Scrum |
| [⚠️ Plan de Riesgos](docs/05-plan-de-riesgos.md) | Matriz de riesgos |
| [💬 Conversaciones](docs/06-conversaciones.md) | 3 entrevistas |

---

## Stack Tecnológico

- **Frontend**: Next.js 15 + React + Tailwind CSS
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: JWT + bcrypt
- **PDF**: Puppeteer
- **Email**: Nodemailer + SMTP
- **Testing**: Jest + Playwright

---

## Entregables Académicos

✅ **Diagrama de Casos de Uso** (8 casos)  
✅ **3 Diagramas de Secuencia**:
1. Registro y Login
2. Solicitud de Cambio de Comisión (Matching)
3. Generación de PDF y Notificación por Email

✅ **2 Contratos de Operaciones**:
1. SendExchangeRequest (Crear solicitud de cambio)
2. AcceptExchangeRequest (Aceptar solicitud + generar PDF + enviar email)

✅ 3 Conversaciones con stakeholders  
🔄 Funcionalidad operativa (en desarrollo)

---

## Estado

📅 **Fase**: Documentación 100% completa  
🎯 **Próximo paso**: Desarrollo Semana 1 (Setup + Auth)  
⏱️ **Duración total**: 6 semanas  
📊 **Progreso**: 0% implementación

---

**Definido por**: Equipo de desarrollo  
**Fecha**: Abril 2025

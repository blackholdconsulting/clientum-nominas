# Clientum Nóminas

Sistema integral de gestión de nóminas para empresas españolas, desarrollado con Next.js 15, TypeScript y Tailwind CSS.

## 🚀 Características Principales

### Gestión de Empleados
- **Registro completo de empleados** con datos personales y laborales
- **Búsqueda y filtrado avanzado** por departamento, posición y estado
- **Perfiles detallados** con historial laboral y documentación
- **Gestión de datos fiscales** (NIE/DNI, número de Seguridad Social)

### Gestión de Contratos
- **Tipos de contrato españoles** (indefinido, temporal, prácticas, formación)
- **Seguimiento de fechas** de inicio, fin y renovaciones
- **Gestión de beneficios** y complementos salariales
- **Alertas automáticas** para contratos próximos a vencer

### Procesamiento de Nóminas
- **Cálculos automáticos** de IRPF y cotizaciones a la Seguridad Social
- **Generación masiva** de nóminas por período
- **Gestión de complementos** y deducciones especiales
- **Histórico completo** de nóminas procesadas

### Informes y Análisis
- **Informes mensuales** de nóminas y costes laborales
- **Análisis por departamento** y distribución de costes
- **Informes fiscales** para Hacienda (Modelo 111, 303)
- **Cotizaciones** para la Seguridad Social (TC1, TC2)
- **Exportación** en PDF y Excel

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Estilos**: Tailwind CSS v4, shadcn/ui
- **Autenticación**: Sistema personalizado con React Context
- **Base de datos**: Preparado para Supabase/PostgreSQL
- **Iconos**: Lucide React
- **Tipografía**: Playfair Display + Inter

## 📋 Requisitos del Sistema

- Node.js 18.0 o superior
- npm 9.0 o superior
- Navegador moderno con soporte para ES2022

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
\`\`\`bash
git clone https://github.com/tu-usuario/clientum-nominas.git
cd clientum-nominas
\`\`\`

### 2. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 3. Configurar variables de entorno
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edita `.env.local` con tus configuraciones:
\`\`\`env
# Base de datos (opcional - usa datos mock por defecto)
DATABASE_URL=tu_url_de_base_de_datos

# Configuración de email (opcional)
SMTP_HOST=tu_servidor_smtp
SMTP_USER=tu_usuario_smtp
SMTP_PASS=tu_contraseña_smtp

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 4. Ejecutar en desarrollo
\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

### 5. Construir para producción
\`\`\`bash
npm run build
npm start
\`\`\`

## 👥 Usuarios de Prueba

Para probar la aplicación, usa estas credenciales:

- **Email**: admin@clientum.es
- **Contraseña**: demo123

## 📁 Estructura del Proyecto

\`\`\`
clientum-nominas/
├── app/                    # App Router de Next.js
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard principal
│   ├── employees/         # Gestión de empleados
│   ├── contracts/         # Gestión de contratos
│   ├── payroll/          # Procesamiento de nóminas
│   ├── reports/          # Informes y análisis
│   └── globals.css       # Estilos globales
├── components/            # Componentes reutilizables
│   ├── auth/             # Componentes de autenticación
│   └── ui/               # Componentes de UI (shadcn/ui)
├── lib/                  # Utilidades y configuración
└── public/               # Archivos estáticos
\`\`\`

## 🔐 Autenticación y Seguridad

### Sistema de Autenticación
- **Autenticación basada en sesiones** con localStorage
- **Protección de rutas** mediante Higher-Order Components
- **Gestión de estado** con React Context
- **Logout automático** por inactividad

### Seguridad de Datos
- **Validación de formularios** en cliente y servidor
- **Sanitización de datos** de entrada
- **Protección CSRF** en formularios
- **Headers de seguridad** configurados

## 💰 Cálculos de Nómina

### Retenciones IRPF
El sistema calcula automáticamente las retenciones de IRPF basándose en:
- **Salario bruto anual**
- **Situación familiar** (soltero, casado, hijos)
- **Tablas oficiales** de Hacienda actualizadas

### Cotizaciones Seguridad Social
Cálculo automático de cotizaciones:
- **Contingencias comunes**: 4.7% (empleado)
- **Desempleo**: 1.55% (empleado)
- **Formación profesional**: 0.1% (empleado)
- **Total empleado**: ~6.35%

### Complementos y Deducciones
- **Plus de transporte**
- **Plus de comida**
- **Horas extras**
- **Anticipos**
- **Embargos judiciales**

## 📊 Informes Disponibles

### Informes Mensuales
- **Resumen de nóminas** por período
- **Desglose por empleado** y departamento
- **Totales de retenciones** e impuestos

### Informes Fiscales
- **Modelo 111** - Retenciones IRPF trimestrales
- **Modelo 303** - IVA trimestral
- **Modelo 190** - Resumen anual de retenciones

### Informes Seguridad Social
- **TC1** - Cotizaciones mensuales
- **TC2** - Relación de trabajadores
- **Certificados** de empresa

## 🚀 Despliegue

### Vercel (Recomendado)
\`\`\`bash
npm install -g vercel
vercel --prod
\`\`\`

### Docker
\`\`\`bash
docker build -t clientum-nominas .
docker run -p 3000:3000 clientum-nominas
\`\`\`

### Servidor tradicional
\`\`\`bash
npm run build
npm start
\`\`\`

## 🔧 Configuración Avanzada

### Base de Datos
Para usar una base de datos real en lugar de datos mock:

1. **Configurar Supabase**:
   - Crear proyecto en Supabase
   - Ejecutar migraciones SQL
   - Configurar Row Level Security (RLS)

2. **Variables de entorno**:
   \`\`\`env
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=...
   \`\`\`

### Email
Para envío automático de nóminas:
\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-app
\`\`\`

## 📝 Cumplimiento Legal

### Normativa Española
- **Real Decreto 1620/2011** - Relación laboral especial
- **Ley del Estatuto de los Trabajadores**
- **Reglamento General de Cotización** (Seguridad Social)
- **Ley del IRPF** y reglamento de desarrollo

### Protección de Datos (RGPD)
- **Consentimiento explícito** para tratamiento de datos
- **Derecho al olvido** y portabilidad
- **Cifrado** de datos sensibles
- **Auditoría** de accesos y modificaciones

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: soporte@clientum.es
- **Documentación**: [docs.clientum.es](https://docs.clientum.es)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/clientum-nominas/issues)

## 🔄 Changelog

### v1.0.0 (2024-12-28)
- ✅ Sistema completo de gestión de empleados
- ✅ Gestión de contratos laborales
- ✅ Procesamiento automático de nóminas
- ✅ Informes y análisis avanzados
- ✅ Interfaz responsive y accesible
- ✅ Localización completa en español

---

**Desarrollado con ❤️ para empresas españolas**

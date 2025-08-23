# API de Cálculos de Nómina

Documentación técnica de los algoritmos y fórmulas utilizadas para el cálculo de nóminas según la legislación española.

## 📊 Cálculo de IRPF

### Fórmula Base
\`\`\`typescript
const calculateIRPF = (grossSalary: number, personalSituation: PersonalSituation): number => {
  const annualSalary = grossSalary * 12;
  const taxableBase = annualSalary - getPersonalDeductions(personalSituation);
  const irpfRate = getIRPFRate(taxableBase, personalSituation);
  return (grossSalary * irpfRate) / 100;
}
\`\`\`

### Tramos de IRPF 2024
| Tramo | Base Liquidable | Tipo |
|-------|----------------|------|
| 1 | Hasta 12.450€ | 19% |
| 2 | 12.450€ - 20.200€ | 24% |
| 3 | 20.200€ - 35.200€ | 30% |
| 4 | 35.200€ - 60.000€ | 37% |
| 5 | 60.000€ - 300.000€ | 45% |
| 6 | Más de 300.000€ | 47% |

### Deducciones Personales
\`\`\`typescript
interface PersonalSituation {
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  children: number;
  dependents: number;
  disability: boolean;
  age: number;
}

const getPersonalDeductions = (situation: PersonalSituation): number => {
  let deductions = 5550; // Mínimo personal

  if (situation.maritalStatus === 'married') {
    deductions += 3400; // Mínimo por cónyuge
  }

  deductions += situation.children * 2400; // Por hijo
  deductions += situation.dependents * 2400; // Por dependiente

  if (situation.disability) {
    deductions += 3000; // Por discapacidad
  }

  if (situation.age >= 65) {
    deductions += 1150; // Por edad
  }

  return deductions;
}
\`\`\`

## 🏥 Cotizaciones a la Seguridad Social

### Bases de Cotización 2024
\`\`\`typescript
const SOCIAL_SECURITY_LIMITS = {
  minimumBase: 1080.00,
  maximumBase: 4495.50,
  unemployment: {
    min: 1080.00,
    max: 4495.50
  }
};
\`\`\`

### Tipos de Cotización (Empleado)
\`\`\`typescript
const EMPLOYEE_RATES = {
  commonContingencies: 4.70, // %
  unemployment: 1.55, // %
  professionalTraining: 0.10, // %
  total: 6.35 // %
};

const calculateSocialSecurity = (grossSalary: number): SocialSecurityContribution => {
  const cotizationBase = Math.min(Math.max(grossSalary, SOCIAL_SECURITY_LIMITS.minimumBase), SOCIAL_SECURITY_LIMITS.maximumBase);
  
  return {
    commonContingencies: (cotizationBase * EMPLOYEE_RATES.commonContingencies) / 100,
    unemployment: (cotizationBase * EMPLOYEE_RATES.unemployment) / 100,
    professionalTraining: (cotizationBase * EMPLOYEE_RATES.professionalTraining) / 100,
    total: (cotizationBase * EMPLOYEE_RATES.total) / 100
  };
};
\`\`\`

### Tipos de Cotización (Empresa)
\`\`\`typescript
const EMPLOYER_RATES = {
  commonContingencies: 23.60, // %
  unemployment: 5.50, // %
  professionalTraining: 0.60, // %
  workAccidents: 0.50, // % (variable según actividad)
  fogasa: 0.20, // %
  total: 30.40 // % (aproximado)
};
\`\`\`

## 💼 Tipos de Contrato

### Configuración por Tipo
\`\`\`typescript
enum ContractType {
  INDEFINITE = 'indefinido',
  TEMPORARY = 'temporal',
  INTERNSHIP = 'practicas',
  TRAINING = 'formacion',
  PART_TIME = 'tiempo_parcial'
}

const CONTRACT_CONFIG = {
  [ContractType.INDEFINITE]: {
    maxDuration: null,
    renewals: 0,
    unemploymentReduction: 0,
    socialSecurityBonus: true
  },
  [ContractType.TEMPORARY]: {
    maxDuration: 24, // meses
    renewals: 3,
    unemploymentReduction: 0,
    socialSecurityBonus: false
  },
  [ContractType.INTERNSHIP]: {
    maxDuration: 24, // meses
    renewals: 1,
    unemploymentReduction: 30, // %
    socialSecurityBonus: true,
    minSalary: 0.60 // % del SMI
  },
  [ContractType.TRAINING]: {
    maxDuration: 36, // meses
    renewals: 1,
    unemploymentReduction: 100, // %
    socialSecurityBonus: true,
    minSalary: 0.75 // % del SMI
  }
};
\`\`\`

## 🎯 Complementos Salariales

### Plus de Transporte
\`\`\`typescript
const TRANSPORT_ALLOWANCE = {
  maxTaxFree: 136.36, // € mensuales exentos
  calculation: (distance: number, workDays: number): number => {
    const dailyAllowance = Math.min(distance * 0.19, 136.36 / workDays);
    return dailyAllowance * workDays;
  }
};
\`\`\`

### Plus de Comida
\`\`\`typescript
const MEAL_ALLOWANCE = {
  maxTaxFree: 11.00, // € por día laborable
  calculation: (workDays: number): number => {
    return Math.min(workDays * 11.00, 220.00); // Máximo mensual
  }
};
\`\`\`

### Horas Extras
\`\`\`typescript
const calculateOvertime = (regularHours: number, overtimeHours: number, hourlyRate: number): OvertimeCalculation => {
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * 1.75; // 75% de recargo
  
  return {
    regularPay,
    overtimePay,
    total: regularPay + overtimePay,
    taxableAmount: overtimePay > 60 ? overtimePay : 0 // Primeras 60€ exentas
  };
};
\`\`\`

## 📋 Deducciones Especiales

### Anticipos
\`\`\`typescript
const processAdvance = (grossSalary: number, advanceAmount: number): AdvanceDeduction => {
  const maxAdvance = grossSalary * 0.90; // Máximo 90% del salario
  const deduction = Math.min(advanceAmount, maxAdvance);
  
  return {
    amount: deduction,
    remaining: advanceAmount - deduction,
    nextMonth: advanceAmount > maxAdvance ? advanceAmount - maxAdvance : 0
  };
};
\`\`\`

### Embargos Judiciales
\`\`\`typescript
const calculateGarnishment = (netSalary: number, garnishmentPercentage: number): number => {
  const minimumWage = 1080.00; // SMI 2024
  const protectedAmount = minimumWage * 1.5; // Cantidad inembargable
  
  if (netSalary <= protectedAmount) {
    return 0;
  }
  
  const garnishableAmount = netSalary - protectedAmount;
  return (garnishableAmount * garnishmentPercentage) / 100;
};
\`\`\`

## 🧮 Cálculo Final de Nómina

### Algoritmo Principal
\`\`\`typescript
interface PayrollCalculation {
  grossSalary: number;
  socialSecurity: number;
  irpf: number;
  advances: number;
  garnishments: number;
  netSalary: number;
  employerCosts: number;
}

const calculatePayroll = (employee: Employee, period: PayrollPeriod): PayrollCalculation => {
  // 1. Calcular salario bruto
  const grossSalary = calculateGrossSalary(employee, period);
  
  // 2. Calcular cotizaciones SS
  const socialSecurity = calculateSocialSecurity(grossSalary);
  
  // 3. Calcular IRPF
  const irpf = calculateIRPF(grossSalary, employee.personalSituation);
  
  // 4. Aplicar deducciones
  const advances = processAdvances(employee.advances);
  const garnishments = calculateGarnishments(employee.garnishments);
  
  // 5. Calcular neto
  const netSalary = grossSalary - socialSecurity.total - irpf - advances - garnishments;
  
  // 6. Calcular costes empresa
  const employerCosts = calculateEmployerCosts(grossSalary);
  
  return {
    grossSalary,
    socialSecurity: socialSecurity.total,
    irpf,
    advances,
    garnishments,
    netSalary,
    employerCosts
  };
};
\`\`\`

## 📊 Validaciones y Controles

### Validación de Datos
\`\`\`typescript
const validatePayrollData = (calculation: PayrollCalculation): ValidationResult => {
  const errors: string[] = [];
  
  // Verificar salario mínimo
  if (calculation.grossSalary < 1080.00) {
    errors.push('El salario bruto no puede ser inferior al SMI');
  }
  
  // Verificar que el neto sea positivo
  if (calculation.netSalary <= 0) {
    errors.push('El salario neto debe ser positivo');
  }
  
  // Verificar límites de cotización
  if (calculation.socialSecurity > calculation.grossSalary * 0.10) {
    errors.push('Las cotizaciones exceden el límite permitido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
\`\`\`

## 🔄 Actualizaciones Anuales

### Parámetros que Cambian Anualmente
- Salario Mínimo Interprofesional (SMI)
- Bases mínimas y máximas de cotización
- Tramos y tipos del IRPF
- Deducciones personales y familiares
- Límites de exención de complementos

### Configuración Dinámica
\`\`\`typescript
const TAX_YEAR_CONFIG = {
  2024: {
    smi: 1080.00,
    irpfTramos: [...],
    socialSecurityLimits: {...},
    personalDeductions: {...}
  },
  2025: {
    // Configuración actualizada
  }
};
\`\`\`

---

Esta documentación se actualiza automáticamente con cada cambio en la legislación española.

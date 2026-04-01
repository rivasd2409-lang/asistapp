ALTER TABLE "Patient"
ADD COLUMN "dni" TEXT,
ADD COLUMN "clinicalSummary" TEXT,
ADD COLUMN "criticalMedications" TEXT,
ADD COLUMN "emergencyAlerts" TEXT,
ADD COLUMN "triageMessage" TEXT,
ADD COLUMN "emergencyContacts" TEXT;

UPDATE "Patient"
SET
  "age" = 67,
  "dni" = '0801-1958-03714',
  "clinicalSummary" = 'Insuficiencia cardiaca por miocardiopatía dilatada isquémica (FE ~30% en estudios previos) con riesgo cardiovascular alto (antecedentes de infarto/arritmias). Deterioro cognitivo / demencia vascular con crisis vespertino-nocturna (agitación, paranoia, llanto, confusión, insomnio). Comorbilidades: hipotiroidismo y prediabetes.',
  "criticalMedications" = '1. Anticoagulante: Apixabán/Eliquis 5 mg (riesgo de sangrado).
2. Conducta/sueño: aripiprazol (Ilimit), olanzapina (Olexa), eszopiclona (Neogaibal).',
  "emergencyAlerts" = '1. Dolor en el pecho, falta de aire, desmayo o presión muy baja.
2. Debilidad de un lado, habla rara, convulsión/rigidez, confusión súbita.
3. Somnolencia excesiva (no despierta bien).
4. Caída o golpe (especialmente en cabeza) por uso de anticoagulante.
5. No orina 8–10 horas o quiere orinar y no puede.',
  "triageMessage" = 'Paciente 67 años con insuficiencia cardiaca (FE ~30%), demencia vascular y en anticoagulante (apixabán). Síntoma: ____ desde hora: ____.',
  "emergencyContacts" = '1. Daniel Rivas - 3152-8281
2. Olga Zelaya - 8829-7623
3. Jimmy Rivas - 3270-4422'
WHERE "name" = 'Wilfredo Rivas Flores';

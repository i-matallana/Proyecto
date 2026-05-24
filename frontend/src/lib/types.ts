// Types for the incapacitation management system

export interface Cliente {
  id: string;
  nombre: string;
  documento: string;
  empresa: string;
  cargo: string;
  email?: string;
  telefono?: string;
  createdAt: string;
}

export interface Incapacidad {
  id: string;
  clienteId: string;
  clienteNombre: string;
  numeroRadicado: string;
  fechaInicio: string;
  fechaFin: string;
  diasIncapacidad: number;
  diagnostico: string;
  codigoCie10: string;
  eps: string;
  medicoTratante?: string;
  estado: "correcto" | "inconsistente" | "ilegible";
  observaciones?: string;
  archivoUrl?: string;
  createdAt: string;
}

export interface DocumentoAnalizado {
  id: string;
  nombreArchivo: string;
  estado: "correcto" | "inconsistente" | "ilegible";
  confianza: number;
  inconsistencias?: Inconsistencia[];
  datosExtraidos?: DatosExtraidos;
  archivoUrl: string;
  createdAt: string;
}

export interface Inconsistencia {
  campo: string;
  valorDetectado: string;
  valorEsperado?: string;
  tipo: "faltante" | "formato" | "valor_sospechoso" | "ilegible";
  posicion?: {
    pagina: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DatosExtraidos {
  nombrePaciente?: string;
  documentoPaciente?: string;
  fechaExpedicion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  diasIncapacidad?: number;
  diagnostico?: string;
  codigoCie10?: string;
  eps?: string;
  medicoTratante?: string;
  numeroRadicado?: string;
}

export interface ResumenAnalisis {
  totalDocumentos: number;
  correctos: number;
  inconsistentes: number;
  ilegibles: number;
  porcentajeCorrectos: number;
  porcentajeInconsistentes: number;
  porcentajeIlegibles: number;
}

export interface AnalysisJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  results?: DocumentoAnalizado[];
}

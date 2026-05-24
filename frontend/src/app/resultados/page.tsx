"use client";

import Link from "next/link";
import { mockResumen, mockDocumentosAnalizados } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  Eye,
} from "lucide-react";

export default function ResultadosPage() {
  const { totalDocumentos, correctos, inconsistentes, ilegibles } = mockResumen;
  const porcentajeCorrectos = Math.round((correctos / totalDocumentos) * 100);
  const porcentajeProblemas = Math.round(
    ((inconsistentes + ilegibles) / totalDocumentos) * 100
  );

  const documentosCorrectos = mockDocumentosAnalizados.filter(
    (d) => d.estado === "correcto"
  );

  const generarReporte = () => {
    // Mock function - would generate a real report
    const reportData = documentosCorrectos.map((doc) => ({
      nombre: doc.datosExtraidos?.nombrePaciente,
      documento: doc.datosExtraidos?.documentoPaciente,
      radicado: doc.datosExtraidos?.numeroRadicado,
      diagnostico: doc.datosExtraidos?.diagnostico,
      fechaInicio: doc.datosExtraidos?.fechaInicio,
      fechaFin: doc.datosExtraidos?.fechaFin,
      dias: doc.datosExtraidos?.diasIncapacidad,
    }));
    console.log("Generating report with data:", reportData);
    alert("Reporte generado exitosamente! (Simulacion)");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Resultados del Analisis
        </h1>
        <p className="text-muted-foreground mt-1">
          Resumen del procesamiento de {totalDocumentos} documentos
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Block - Correct Documents */}
        <Card className="border-success/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-success/10">
                  <CheckCircle className="text-success" />
                </div>
                <div>
                  <CardTitle>Documentos Correctos</CardTitle>
                  <CardDescription>
                    Archivos procesados sin errores
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-success">
                  {porcentajeCorrectos}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {correctos} de {totalDocumentos}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress
              value={porcentajeCorrectos}
              className="h-3 [&>div]:bg-success"
            />

            <div className="rounded-lg border bg-card p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="text-success" />
                Empleados con Incapacidades Validadas
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {documentosCorrectos.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">
                        {doc.datosExtraidos?.nombrePaciente || "Sin nombre"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Radicado: {doc.datosExtraidos?.numeroRadicado || "N/A"}
                      </p>
                    </div>
                    <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                      {doc.datosExtraidos?.diasIncapacidad || 0} dias
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={generarReporte}>
              <Download data-icon="inline-start" />
              Generar Documento de Empleados
            </Button>
          </CardContent>
        </Card>

        {/* Right Block - Problems */}
        <Card className="border-warning/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-warning/10">
                  <AlertTriangle className="text-warning-foreground" />
                </div>
                <div>
                  <CardTitle>Requieren Atencion</CardTitle>
                  <CardDescription>
                    Documentos con inconsistencias o ilegibles
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-warning-foreground">
                  {porcentajeProblemas}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {inconsistentes + ilegibles} de {totalDocumentos}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress
              value={porcentajeProblemas}
              className="h-3 [&>div]:bg-warning"
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Inconsistentes */}
              <div className="rounded-lg border p-4 bg-warning/5 border-warning/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-warning-foreground" />
                  <span className="font-medium">Inconsistentes</span>
                </div>
                <p className="text-3xl font-bold">{inconsistentes}</p>
                <p className="text-sm text-muted-foreground">
                  Posibles errores detectados
                </p>
              </div>

              {/* Ilegibles */}
              <div className="rounded-lg border p-4 bg-danger/5 border-danger/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="text-danger" />
                  <span className="font-medium">Ilegibles</span>
                </div>
                <p className="text-3xl font-bold">{ilegibles}</p>
                <p className="text-sm text-muted-foreground">
                  No se pudieron procesar
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Revisa los documentos con problemas para corregir errores o
                marcarlos manualmente.
              </p>
            </div>

            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/detalles">
                <Eye data-icon="inline-start" />
                Ver Detalles
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{totalDocumentos}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Total Documentos
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-success">{correctos}</p>
              <p className="text-sm text-muted-foreground mt-1">Correctos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-warning-foreground">
                {inconsistentes}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Inconsistentes
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-danger">{ilegibles}</p>
              <p className="text-sm text-muted-foreground mt-1">Ilegibles</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mockDocumentosAnalizados } from "@/lib/mock-data";
import type { DocumentoAnalizado, Inconsistencia } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Save,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentoDetallePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Find the document
  const originalDoc = mockDocumentosAnalizados.find((d) => d.id === id);

  const [document, setDocument] = useState<DocumentoAnalizado | null>(
    originalDoc || null
  );
  const [editedData, setEditedData] = useState(
    originalDoc?.datosExtraidos || {}
  );
  const [nuevoEstado, setNuevoEstado] = useState<
    "correcto" | "inconsistente" | "ilegible"
  >(originalDoc?.estado || "correcto");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);

  if (!document) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Documento no encontrado</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/detalles">Volver a Detalles</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (estado: string) => {
    switch (estado) {
      case "correcto":
        return {
          icon: CheckCircle,
          color: "text-success",
          bgColor: "bg-success/10",
          label: "Correcto",
        };
      case "inconsistente":
        return {
          icon: AlertTriangle,
          color: "text-warning-foreground",
          bgColor: "bg-warning/10",
          label: "Inconsistente",
        };
      case "ilegible":
        return {
          icon: XCircle,
          color: "text-danger",
          bgColor: "bg-danger/10",
          label: "Ilegible",
        };
      default:
        return {
          icon: FileText,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          label: "Desconocido",
        };
    }
  };

  const handleFieldChange = (field: string, value: string | number) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // Update the document with edited data and new status
    setDocument((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        estado: nuevoEstado,
        datosExtraidos: editedData,
        // Clear inconsistencias if marked as correcto
        inconsistencias:
          nuevoEstado === "correcto" ? [] : prev.inconsistencias,
      };
    });
    setShowSaveDialog(false);

    // Redirect back to details page
    router.push("/detalles");
  };

  const status = getStatusConfig(document.estado);
  const StatusIcon = status.icon;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/detalles">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {document.nombreArchivo}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              className={cn(
                status.bgColor,
                status.color,
                "border",
                document.estado === "correcto" && "border-success/20",
                document.estado === "inconsistente" && "border-warning/20",
                document.estado === "ilegible" && "border-danger/20"
              )}
            >
              <StatusIcon className="mr-1" />
              {status.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Confianza: {document.confianza.toFixed(1)}%
            </span>
          </div>
        </div>
        <Button onClick={() => setShowSaveDialog(true)}>
          <Save data-icon="inline-start" />
          Finalizar Correccion
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer - Left Side */}
        <div className="flex-1 bg-muted/30 flex flex-col">
          {/* PDF Controls */}
          <div className="flex items-center justify-center gap-2 p-3 border-b bg-card">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPdfZoom((z) => Math.max(50, z - 10))}
            >
              <ZoomOut />
            </Button>
            <span className="text-sm font-medium w-16 text-center">
              {pdfZoom}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPdfZoom((z) => Math.min(200, z + 10))}
            >
              <ZoomIn />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button variant="outline" size="icon">
              <RotateCw />
            </Button>
          </div>

          {/* PDF Display */}
          <ScrollArea className="flex-1">
            <div
              className="p-8 flex justify-center"
              style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: "top center" }}
            >
              {/* Mock PDF representation */}
              <div className="bg-white shadow-lg rounded-lg w-[595px] min-h-[842px] p-12 relative">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center border-b pb-4">
                    <h2 className="text-xl font-bold">
                      CERTIFICADO DE INCAPACIDAD
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {document.datosExtraidos?.eps || "EPS"}
                    </p>
                  </div>

                  {/* Content with highlighted inconsistencies */}
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500">Paciente:</p>
                        <p className="font-medium">
                          {document.datosExtraidos?.nombrePaciente || "---"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Documento:</p>
                        <p className="font-medium">
                          {document.datosExtraidos?.documentoPaciente || "---"}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-gray-500">Diagnostico:</p>
                      <p className="font-medium">
                        {document.datosExtraidos?.diagnostico || "---"}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className={cn(
                          "p-2 rounded",
                          document.inconsistencias?.some(
                            (i) => i.campo === "fechaInicio"
                          ) && "bg-yellow-100 ring-2 ring-yellow-400"
                        )}
                      >
                        <p className="text-gray-500">Fecha Inicio:</p>
                        <p className="font-medium">
                          {document.datosExtraidos?.fechaInicio || "---"}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "p-2 rounded",
                          document.inconsistencias?.some(
                            (i) => i.campo === "fechaFin"
                          ) && "bg-yellow-100 ring-2 ring-yellow-400"
                        )}
                      >
                        <p className="text-gray-500">Fecha Fin:</p>
                        <p className="font-medium">
                          {document.datosExtraidos?.fechaFin || "---"}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "p-2 rounded",
                          document.inconsistencias?.some(
                            (i) => i.campo === "diasIncapacidad"
                          ) && "bg-yellow-100 ring-2 ring-yellow-400"
                        )}
                      >
                        <p className="text-gray-500">Dias:</p>
                        <p className="font-medium">
                          {document.datosExtraidos?.diasIncapacidad || "---"}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div
                      className={cn(
                        "p-2 rounded",
                        document.inconsistencias?.some(
                          (i) => i.campo === "codigoCie10"
                        ) && "bg-yellow-100 ring-2 ring-yellow-400"
                      )}
                    >
                      <p className="text-gray-500">Codigo CIE-10:</p>
                      <p className="font-medium">
                        {document.datosExtraidos?.codigoCie10 || "---"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Numero de Radicado:</p>
                      <p className="font-medium font-mono">
                        {document.datosExtraidos?.numeroRadicado || "---"}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-12 left-12 right-12 border-t pt-4">
                    <p className="text-xs text-gray-400 text-center">
                      Documento digitalizado - {document.createdAt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Inconsistencies & Edit Form */}
        <div className="w-96 border-l bg-card flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Inconsistencies Panel */}
              {document.inconsistencias &&
                document.inconsistencias.length > 0 && (
                  <Card className="border-warning/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="text-warning-foreground" />
                        Inconsistencias Detectadas
                      </CardTitle>
                      <CardDescription>
                        {document.inconsistencias.length} problemas encontrados
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {document.inconsistencias.map((inc, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-warning/5 border border-warning/20"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm capitalize">
                              {inc.campo.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {inc.tipo}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Detectado:{" "}
                            <span className="font-mono">{inc.valorDetectado}</span>
                          </p>
                          {inc.valorEsperado && (
                            <p className="text-sm text-muted-foreground">
                              Esperado:{" "}
                              <span className="font-mono text-success">
                                {inc.valorEsperado}
                              </span>
                            </p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

              {/* Edit Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Editar Datos</CardTitle>
                  <CardDescription>
                    Corrige la informacion extraida
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Nombre del Paciente
                    </label>
                    <Input
                      value={editedData.nombrePaciente || ""}
                      onChange={(e) =>
                        handleFieldChange("nombrePaciente", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Documento
                    </label>
                    <Input
                      value={editedData.documentoPaciente || ""}
                      onChange={(e) =>
                        handleFieldChange("documentoPaciente", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Numero de Radicado
                    </label>
                    <Input
                      value={editedData.numeroRadicado || ""}
                      onChange={(e) =>
                        handleFieldChange("numeroRadicado", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Fecha Inicio
                      </label>
                      <Input
                        type="date"
                        value={editedData.fechaInicio || ""}
                        onChange={(e) =>
                          handleFieldChange("fechaInicio", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Fecha Fin
                      </label>
                      <Input
                        type="date"
                        value={editedData.fechaFin || ""}
                        onChange={(e) =>
                          handleFieldChange("fechaFin", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Dias de Incapacidad
                    </label>
                    <Input
                      type="number"
                      value={editedData.diasIncapacidad || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "diasIncapacidad",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Diagnostico
                    </label>
                    <Textarea
                      value={editedData.diagnostico || ""}
                      onChange={(e) =>
                        handleFieldChange("diagnostico", e.target.value)
                      }
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Codigo CIE-10
                    </label>
                    <Input
                      value={editedData.codigoCie10 || ""}
                      onChange={(e) =>
                        handleFieldChange("codigoCie10", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      EPS
                    </label>
                    <Input
                      value={editedData.eps || ""}
                      onChange={(e) =>
                        handleFieldChange("eps", e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Correccion</DialogTitle>
            <DialogDescription>
              Selecciona el estado final del documento y guarda los cambios.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Estado del Documento
            </label>
            <Select
              value={nuevoEstado}
              onValueChange={(v) =>
                setNuevoEstado(v as "correcto" | "inconsistente" | "ilegible")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="correcto">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-success" />
                    Correcto - Sin inconsistencias
                  </div>
                </SelectItem>
                <SelectItem value="inconsistente">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-warning-foreground" />
                    Presenta inconsistencias
                  </div>
                </SelectItem>
                <SelectItem value="ilegible">
                  <div className="flex items-center gap-2">
                    <XCircle className="text-danger" />
                    Ilegible
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save data-icon="inline-start" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

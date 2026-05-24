"use client";

import { useState } from "react";
import Link from "next/link";
import { mockDocumentosAnalizados } from "@/lib/mock-data";
import type { DocumentoAnalizado } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Edit,
  Trash2,
  MoreVertical,
  Download,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DetallesPage() {
  const [documents, setDocuments] =
    useState<DocumentoAnalizado[]>(mockDocumentosAnalizados);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [showGenerateButton, setShowGenerateButton] = useState(false);

  // Sort documents: inconsistentes (yellow) -> ilegibles (red) -> correctos (green)
  const sortedDocuments = [...documents].sort((a, b) => {
    const order = { inconsistente: 0, ilegible: 1, correcto: 2 };
    return order[a.estado] - order[b.estado];
  });

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    setDeleteDialog(null);
    setShowGenerateButton(true);
  };

  const getStatusConfig = (estado: string) => {
    switch (estado) {
      case "correcto":
        return {
          icon: CheckCircle,
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-success/30",
          label: "Correcto",
          badgeClass: "bg-success/10 text-success border-success/20",
        };
      case "inconsistente":
        return {
          icon: AlertTriangle,
          color: "text-warning-foreground",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/30",
          label: "Inconsistente",
          badgeClass: "bg-warning/10 text-warning-foreground border-warning/20",
        };
      case "ilegible":
        return {
          icon: XCircle,
          color: "text-danger",
          bgColor: "bg-danger/10",
          borderColor: "border-danger/30",
          label: "Ilegible",
          badgeClass: "bg-danger/10 text-danger border-danger/20",
        };
      default:
        return {
          icon: FileText,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
          label: "Desconocido",
          badgeClass: "",
        };
    }
  };

  const generarDocumento = () => {
    const documentosCorrectos = documents.filter((d) => d.estado === "correcto");
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
    alert(
      `Documento generado con ${documentosCorrectos.length} empleados y sus numeros de radicado.`
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/resultados">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            Detalle de Documentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Revisa y corrige los documentos analizados
          </p>
        </div>
        {showGenerateButton && (
          <Button onClick={generarDocumento}>
            <Download data-icon="inline-start" />
            Generar Documento de Empleados
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <div className="size-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">Sospecha de inconsistencias</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="size-3 rounded-full bg-danger" />
          <span className="text-muted-foreground">Ilegibles</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="size-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Correctos</span>
        </div>
      </div>

      {/* Document List */}
      <div className="grid gap-4">
        {sortedDocuments.map((doc) => {
          const status = getStatusConfig(doc.estado);
          const StatusIcon = status.icon;

          return (
            <Card
              key={doc.id}
              className={cn("transition-all hover:shadow-md", status.borderColor)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className={cn("rounded-full p-3", status.bgColor)}>
                    <StatusIcon className={status.color} />
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {doc.nombreArchivo}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.datosExtraidos?.nombrePaciente || "Nombre no detectado"}{" "}
                          -{" "}
                          {doc.datosExtraidos?.documentoPaciente || "Doc. no detectado"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={status.badgeClass}>
                          {status.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Confianza: {doc.confianza.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Extracted Data Preview */}
                    {doc.datosExtraidos && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-xs text-muted-foreground">Radicado</p>
                          <p className="font-medium text-sm">
                            {doc.datosExtraidos.numeroRadicado || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Diagnostico</p>
                          <p className="font-medium text-sm truncate">
                            {doc.datosExtraidos.diagnostico || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Periodo</p>
                          <p className="font-medium text-sm">
                            {doc.datosExtraidos.fechaInicio || "?"} -{" "}
                            {doc.datosExtraidos.fechaFin || "?"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Dias</p>
                          <p className="font-medium text-sm">
                            {doc.datosExtraidos.diasIncapacidad || "N/A"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Inconsistencies Preview */}
                    {doc.inconsistencias && doc.inconsistencias.length > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                        <p className="text-sm font-medium text-warning-foreground mb-2">
                          Inconsistencias detectadas:
                        </p>
                        <ul className="text-sm space-y-1">
                          {doc.inconsistencias.slice(0, 2).map((inc, idx) => (
                            <li key={idx} className="text-muted-foreground">
                              <span className="font-medium">{inc.campo}:</span>{" "}
                              {inc.valorDetectado}
                              {inc.valorEsperado && (
                                <span>
                                  {" "}
                                  (esperado: {inc.valorEsperado})
                                </span>
                              )}
                            </li>
                          ))}
                          {doc.inconsistencias.length > 2 && (
                            <li className="text-muted-foreground">
                              +{doc.inconsistencias.length - 2} mas...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/detalles/${doc.id}`}>
                        <Eye data-icon="inline-start" />
                        Ver Detalles
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/detalles/${doc.id}`}>
                            <Edit className="mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteDialog(doc.id)}
                        >
                          <Trash2 className="mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar documento</DialogTitle>
            <DialogDescription>
              Esta seguro que desea eliminar este documento? Esta accion no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadingMessages } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  file: File;
  status: "pending" | "converting" | "ready" | "error";
  progress: number;
}

export default function SubirPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File): UploadedFile => {
    const id = Math.random().toString(36).substring(7);
    const isPdf = file.type === "application/pdf";

    return {
      id,
      file,
      status: isPdf ? "ready" : "converting",
      progress: isPdf ? 100 : 0,
    };
  };

  const simulateConversion = (uploadedFile: UploadedFile) => {
    if (uploadedFile.status !== "converting") return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, status: "ready", progress: 100 }
              : f
          )
        );
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, progress } : f
          )
        );
      }
    }, 200);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    const newFiles = validFiles.map(processFile);
    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((f) => {
      if (f.status === "converting") {
        simulateConversion(f);
      }
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.map(processFile);
    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((f) => {
      if (f.status === "converting") {
        simulateConversion(f);
      }
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    let messageIndex = 0;
    let progress = 0;

    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length) {
        setCurrentMessage(loadingMessages[messageIndex]);
        messageIndex++;
      }
    }, 1500);

    const progressInterval = setInterval(() => {
      progress += Math.random() * 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        setAnalysisProgress(100);
        setCurrentMessage("Analisis completado!");

        setTimeout(() => {
          router.push("/resultados");
        }, 1000);
      } else {
        setAnalysisProgress(progress);
      }
    }, 400);
  };

  const readyFiles = files.filter((f) => f.status === "ready");
  const canStartAnalysis = readyFiles.length > 0 && !isAnalyzing;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Subir Documentos
        </h1>
        <p className="text-muted-foreground mt-1">
          Carga los archivos de incapacidades para su analisis con IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cargar Archivos</CardTitle>
              <CardDescription>
                Arrastra archivos PDF, imagenes o documentos Word. Los archivos
                que no sean PDF seran convertidos automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center transition-all",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="flex flex-col items-center gap-4">
                  <div
                    className={cn(
                      "rounded-full p-4 transition-colors",
                      isDragging ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    <Upload
                      className={cn(
                        "size-8",
                        isDragging ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      Arrastra tus archivos aqui
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      o haz clic para seleccionar archivos
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.docx"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-input"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="file-input" className="cursor-pointer">
                      Seleccionar Archivos
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PDF, PNG, JPG, DOCX (max. 10MB por archivo)
                  </p>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-medium">
                    Archivos cargados ({files.length})
                  </h3>
                  <div className="space-y-2">
                    {files.map((uploadedFile) => (
                      <div
                        key={uploadedFile.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <FileText className="text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {uploadedFile.file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {(uploadedFile.file.size / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </span>
                            {uploadedFile.status === "converting" && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                                <span className="text-xs text-primary">
                                  Convirtiendo a PDF...
                                </span>
                              </>
                            )}
                          </div>
                          {uploadedFile.status === "converting" && (
                            <Progress
                              value={uploadedFile.progress}
                              className="h-1 mt-2"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {uploadedFile.status === "ready" && (
                            <Badge
                              variant="outline"
                              className="bg-success/10 text-success border-success/20"
                            >
                              <CheckCircle className="mr-1" />
                              Listo
                            </Badge>
                          )}
                          {uploadedFile.status === "error" && (
                            <Badge variant="destructive">
                              <AlertCircle className="mr-1" />
                              Error
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(uploadedFile.id)}
                            disabled={isAnalyzing}
                          >
                            <X />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis Panel */}
        <div>
          <Card
            className={cn(
              "sticky top-8 transition-all",
              isAnalyzing && "ring-2 ring-primary"
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-primary" />
                Analisis con IA
              </CardTitle>
              <CardDescription>
                Nuestro sistema analizara los documentos para extraer la
                informacion y detectar inconsistencias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAnalyzing ? (
                <>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Archivos listos
                      </span>
                      <span className="font-medium">{readyFiles.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        En conversion
                      </span>
                      <span className="font-medium">
                        {files.filter((f) => f.status === "converting").length}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!canStartAnalysis}
                    onClick={startAnalysis}
                  >
                    <Sparkles data-icon="inline-start" />
                    Iniciar Analisis IA
                  </Button>

                  {files.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground">
                      Sube al menos un archivo para comenzar
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="relative mx-auto w-16 h-16 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-muted" />
                      <div
                        className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                        style={{
                          animationDuration: "1s",
                        }}
                      />
                      <Sparkles className="absolute inset-0 m-auto text-primary" />
                    </div>
                    <p className="font-medium text-lg">{currentMessage}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.round(analysisProgress)}% completado
                    </p>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

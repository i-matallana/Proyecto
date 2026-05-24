"use client";

import { useState } from "react";
import { mockClientes, mockIncapacidades } from "@/lib/mock-data";
import type { Incapacidad } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, FileText, Users, Calendar } from "lucide-react";

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClientes = mockClientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.documento.includes(searchTerm) ||
      cliente.empresa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIncapacidadesByCliente = (clienteId: string): Incapacidad[] => {
    return mockIncapacidades.filter((inc) => inc.clienteId === clienteId);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "correcto":
        return "bg-success/10 text-success border-success/20";
      case "inconsistente":
        return "bg-warning/10 text-warning-foreground border-warning/20";
      case "ilegible":
        return "bg-danger/10 text-danger border-danger/20";
      default:
        return "";
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Gestion de Clientes
        </h1>
        <p className="text-muted-foreground mt-1">
          Administra los clientes y sus incapacidades
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clientes
            </CardTitle>
            <Users className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockClientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Incapacidades Activas
            </CardTitle>
            <FileText className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockIncapacidades.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dias Totales
            </CardTitle>
            <Calendar className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mockIncapacidades.reduce((acc, inc) => acc + inc.diasIncapacidad, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="clientes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="incapacidades">Incapacidades</TabsTrigger>
        </TabsList>

        {/* Clientes Tab */}
        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Lista de Clientes</CardTitle>
                  <CardDescription>
                    Gestiona la informacion de los empleados
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente..."
                      className="pl-10 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button>
                    <Plus data-icon="inline-start" />
                    Nuevo Cliente
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Incapacidades</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => {
                    const incapacidades = getIncapacidadesByCliente(cliente.id);
                    return (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">
                          {cliente.nombre}
                        </TableCell>
                        <TableCell>{cliente.documento}</TableCell>
                        <TableCell>{cliente.empresa}</TableCell>
                        <TableCell>{cliente.cargo}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {incapacidades.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCliente(cliente)}
                              >
                                Ver detalles
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{cliente.nombre}</DialogTitle>
                                <DialogDescription>
                                  Informacion del cliente e historial de
                                  incapacidades
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Documento
                                    </p>
                                    <p className="font-medium">
                                      {cliente.documento}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Empresa
                                    </p>
                                    <p className="font-medium">
                                      {cliente.empresa}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Cargo
                                    </p>
                                    <p className="font-medium">
                                      {cliente.cargo}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Email
                                    </p>
                                    <p className="font-medium">
                                      {cliente.email || "No registrado"}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-3">
                                    Historial de Incapacidades
                                  </h4>
                                  {incapacidades.length > 0 ? (
                                    <div className="space-y-3">
                                      {incapacidades.map((inc) => (
                                        <div
                                          key={inc.id}
                                          className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                          <div>
                                            <p className="font-medium">
                                              {inc.diagnostico}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              {inc.fechaInicio} - {inc.fechaFin}{" "}
                                              ({inc.diasIncapacidad} dias)
                                            </p>
                                          </div>
                                          <Badge
                                            className={getEstadoColor(
                                              inc.estado
                                            )}
                                          >
                                            {inc.estado}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">
                                      No hay incapacidades registradas
                                    </p>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incapacidades Tab */}
        <TabsContent value="incapacidades">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Todas las Incapacidades</CardTitle>
                  <CardDescription>
                    Historial completo de incapacidades registradas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Radicado</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Diagnostico</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>EPS</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockIncapacidades.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell className="font-mono text-sm">
                        {inc.numeroRadicado}
                      </TableCell>
                      <TableCell className="font-medium">
                        {inc.clienteNombre}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{inc.diagnostico}</p>
                          <p className="text-xs text-muted-foreground">
                            CIE-10: {inc.codigoCie10}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {inc.fechaInicio} - {inc.fechaFin}
                      </TableCell>
                      <TableCell>{inc.diasIncapacidad}</TableCell>
                      <TableCell>{inc.eps}</TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(inc.estado)}>
                          {inc.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

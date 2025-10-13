import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Plus, Download, Search, Trash2, Loader2 } from "lucide-react";
import { EmptyState } from "../components/admin/EmptyState";
import { toast } from "sonner";

export function ComponentLibraryPage() {
  const [loading, setLoading] = useState(false);

  const handleToast = (type: string) => {
    switch (type) {
      case "success":
        toast.success("Operação concluída com sucesso!");
        break;
      case "error":
        toast.error("Ocorreu um erro ao processar a solicitação");
        break;
      case "warning":
        toast.warning("Atenção: Esta ação requer confirmação");
        break;
      case "info":
        toast.info("Informação importante");
        break;
    }
  };

  return (
    <div>
      <PageHeader title="Component Library" />

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 text-muted-foreground">Variants</div>
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            <div>
              <div className="mb-2 text-muted-foreground">Sizes</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div>
              <div className="mb-2 text-muted-foreground">With Icons</div>
              <div className="flex flex-wrap gap-2">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
            <div>
              <div className="mb-2 text-muted-foreground">States</div>
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" />
              <p className="text-muted-foreground">Digite seu endereço de email</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search with Icon</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="search" className="pl-9" placeholder="Buscar..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="error">Input with Error</Label>
              <Input id="error" className="border-destructive" />
              <p className="text-destructive">Este campo é obrigatório</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="select">Select</Label>
              <Select>
                <SelectTrigger id="select">
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Opção 1</SelectItem>
                  <SelectItem value="2">Opção 2</SelectItem>
                  <SelectItem value="3">Opção 3</SelectItem>
                  <SelectItem value="4">Opção 4</SelectItem>
                  <SelectItem value="5">Opção 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dialogs & Modals</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Ação</DialogTitle>
                  <DialogDescription>
                    Tem certeza que deseja prosseguir com esta ação? Esta operação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button>Confirmar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <p>Overview content goes here</p>
              </TabsContent>
              <TabsContent value="details" className="space-y-4">
                <p>Details content goes here</p>
              </TabsContent>
              <TabsContent value="activity" className="space-y-4">
                <p>Activity content goes here</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-muted/50">
                  <TableCell>João Silva</TableCell>
                  <TableCell>joao@example.com</TableCell>
                  <TableCell>
                    <Badge>Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-muted/50">
                  <TableCell>Maria Santos</TableCell>
                  <TableCell>maria@example.com</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Inactive</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empty State</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Search}
              title="Nenhum resultado encontrado"
              description="Não encontramos nenhum item correspondente aos seus critérios de busca. Tente ajustar os filtros."
              primaryAction={{ label: "Limpar Filtros", onClick: () => {} }}
              secondaryAction={{ label: "Adicionar Novo", onClick: () => {} }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Toasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleToast("success")} variant="outline">
                Success Toast
              </Button>
              <Button onClick={() => handleToast("error")} variant="outline">
                Error Toast
              </Button>
              <Button onClick={() => handleToast("warning")} variant="outline">
                Warning Toast
              </Button>
              <Button onClick={() => handleToast("info")} variant="outline">
                Info Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

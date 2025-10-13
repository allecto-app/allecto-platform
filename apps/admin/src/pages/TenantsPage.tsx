import { useMemo, useState } from "react";
import { Building2, Search, Eye, Edit, Ban, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { EmptyState } from "../components/admin/EmptyState";
import { toast } from "sonner";
import { Doc, Id } from "../lib/convexGenerated";

interface TenantsPageProps {
  onNavigate: (page: string) => void;
  condos: Doc<"condos">[] | undefined;
  isLoading: boolean;
  onSelectCondo: (condoId: Id<"condos"> | null) => void;
  selectedCondoId: Id<"condos"> | null;
}

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(timestamp));

export function TenantsPage({
  onNavigate,
  condos,
  isLoading,
  onSelectCondo,
  selectedCondoId,
}: TenantsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTenants = useMemo(
    () =>
      (condos ?? []).filter((tenant) => {
        const nameMatch = tenant.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const subdomainMatch = tenant.subdomain
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return nameMatch || subdomainMatch;
      }),
    [condos, searchTerm],
  );

  const handleOpenTenantView = (tenant: Doc<"condos">) => {
    onSelectCondo(tenant._id);
    onNavigate("dashboard");
    toast.success(`Entered tenant view for ${tenant.name}`);
  };

  const handleEditBranding = (name: string) => {
    toast.info(`Edit branding for ${name}`);
  };

  const handleDisable = (name: string) => {
    toast.warning(`${name} disabled`);
  };

  return (
    <div>
      <PageHeader
        title="Tenants"
        primaryAction={{
          label: "Create Condo",
          onClick: () => onNavigate("onboarding"),
        }}
      />

      <div className="mb-6 flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or subdomain..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando condomínios...
          </CardContent>
        </Card>
      ) : filteredTenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum condomínio encontrado"
          description="Crie seu primeiro condomínio para começar a usar a plataforma."
          primaryAction={{
            label: "Criar Condomínio",
            onClick: () => onNavigate("onboarding"),
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Active Minutes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant._id}>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {tenant.subdomain}.allecto.app
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(tenant.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">--</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={selectedCondoId === tenant._id ? "default" : "secondary"}>
                      {selectedCondoId === tenant._id ? "Selecionado" : "Ativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenTenantView(tenant)}
                      >
                        <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBranding(tenant.name)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisable(tenant.name)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

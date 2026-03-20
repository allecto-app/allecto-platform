import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Building2, Search } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { EmptyState } from "../components/admin/EmptyState";
import { api, Doc } from "../lib/convexGenerated";
import { Loader2 } from "lucide-react";
import { BulkUploadButton } from "../components/bulk-upload/BulkUploadButton";

interface UnitsListPageProps {
  onNavigate: (page: string) => void;
  condo: Doc<"condos"> | null;
  sessionToken: string;
  onSelectUnit?: (unit: Doc<"units">) => void;
}

type UnitListItem = Doc<"units"> & { residentsCount?: number };

export function UnitsListPage({ onNavigate, condo, sessionToken, onSelectUnit }: UnitsListPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [blockFilter, setBlockFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");

  const units = useQuery(
    api.units.listByCondoWithResidentCounts,
    condo && sessionToken ? { sessionToken, condoId: condo._id } : "skip",
  ) as UnitListItem[] | undefined;

  const blocks = useMemo(() => {
    if (!units) return [] as string[];
    const values = new Set<string>();
    for (const unit of units as UnitListItem[]) {
      if (unit.block) values.add(unit.block);
    }
    return Array.from(values).sort();
  }, [units]);

  const floors = useMemo(() => {
    if (!units) return [] as string[];
    const values = new Set<string>();
    for (const unit of units as UnitListItem[]) {
      if (unit.floor) values.add(unit.floor);
    }
    return Array.from(values).sort();
  }, [units]);

  const filteredUnits = useMemo(() => {
    if (!units) return [];
    return units.filter((unit: UnitListItem) => {
      const matchesSearch = unit.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBlock = blockFilter === "all" || unit.block === blockFilter;
      const matchesFloor = floorFilter === "all" || unit.floor === floorFilter;
      return matchesSearch && matchesBlock && matchesFloor;
    });
  }, [units, searchTerm, blockFilter, floorFilter]);

  const isLoading = !!condo && !!sessionToken && !units;

  return (
    <div>
      <PageHeader
        title="Unidades"
        primaryAction={{
          label: "Adicionar",
          onClick: () => onNavigate("unit-edit"),
          disabled: !condo,
        }}
      />

      <div className="mb-4 flex justify-end">
        <BulkUploadButton condo={condo} />
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="flex-1 space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar unidade"
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!condo}
            />
          </div>
        </div>
        <div className="w-full md:w-48 space-y-2">
          <Label>Bloco</Label>
          <Select value={blockFilter} onValueChange={setBlockFilter}>
            <SelectTrigger disabled={!condo}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {blocks.map((block) => (
                <SelectItem key={block} value={block}>
                  Bloco {block}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48 space-y-2">
          <Label>Andar</Label>
          <Select value={floorFilter} onValueChange={setFloorFilter}>
            <SelectTrigger disabled={!condo}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {floors.map((floor) => (
                <SelectItem key={floor} value={floor}>
                  {floor}º andar
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!condo ? (
        <EmptyState
          icon={Building2}
          title="Selecione um condomínio"
          description="Escolha um condomínio para visualizar as unidades."
        />
      ) : isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando unidades...
          </CardContent>
        </Card>
      ) : filteredUnits.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma unidade encontrada"
          description="Não há unidades correspondentes aos filtros selecionados."
          primaryAction={{
            label: "Adicionar Unidade",
            onClick: () => onNavigate("unit-edit"),
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Andar</TableHead>
                  <TableHead>Moradores</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit) => (
                  <TableRow key={unit._id}>
                    <TableCell>{unit.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{unit.block ?? "--"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {unit.floor ?? "--"}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{unit.residentsCount ?? 0}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onSelectUnit?.(unit);
                          onNavigate("unit-detail");
                        }}
                      >
                        Ver Detalhes
                      </Button>
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

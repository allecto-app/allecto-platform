import { useState } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export function SettingsBrandingPage() {
  const [primaryColor, setPrimaryColor] = useState("#042940");
  const [secondaryColor, setSecondaryColor] = useState("#9FC131");
  const [accentColor, setAccentColor] = useState("#005C53");

  const handleSave = () => {
    toast.success("Configurações de branding salvas com sucesso!");
  };

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
                  <span className="text-primary-foreground text-[28px]">A</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="logo">Upload Logo</Label>
                <div className="flex gap-2">
                  <Input id="logo" type="file" accept="image/*" />
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cores da Marca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Cor Primária</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Input
                    id="primary-color"
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-color">Cor Secundária</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <Input
                    id="secondary-color"
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Cor de Destaque</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: accentColor }}
                  />
                  <Input
                    id="accent-color"
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prévia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border p-6">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white">A</span>
                </div>
                <span className="text-foreground">Allecto Admin</span>
              </div>
              <div className="flex gap-2">
                <Button style={{ backgroundColor: primaryColor, color: "white" }}>
                  Primary
                </Button>
                <Button
                  style={{ backgroundColor: secondaryColor, color: primaryColor }}
                >
                  Secondary
                </Button>
                <Button
                  style={{ backgroundColor: accentColor, color: "white" }}
                >
                  Accent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Salvar Alterações</Button>
      </div>
    </div>
  );
}

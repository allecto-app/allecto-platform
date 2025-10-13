import { useState } from "react";
import { useMutation } from "convex/react";
import { CheckCircle2, Upload } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { api, Id } from "../lib/convexGenerated";

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
  onSelectCondo: (condoId: Id<"condos">) => void;
}

export function OnboardingPage({ onNavigate, onSelectCondo }: OnboardingPageProps) {
  const [condoName, setCondoName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#042940");
  const [secondaryColor, setSecondaryColor] = useState("#9FC131");
  const [syndicName, setSyndicName] = useState("");
  const [syndicEmail, setSyndicEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCondo = useMutation(api.condos.create);
  const inviteResident = useMutation(api.residents.invite);

  const handleCreate = async () => {
    if (!condoName || !subdomain || !syndicName || !syndicEmail) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const condoId = await createCondo({
        name: condoName,
        subdomain,
        branding: {
          displayName: condoName,
          primaryColor,
          secondaryColor,
        },
      });

      await inviteResident({
        condoId,
        name: syndicName,
        email: syndicEmail,
        role: "syndic",
      });

      toast.success(`Condomínio ${condoName} created successfully!`);
      onSelectCondo(condoId);
      onNavigate("dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create condo";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Onboarding"
        breadcrumb={["Platform", "Onboarding"]}
        secondaryAction={{
          label: "Cancel",
          onClick: () => onNavigate("tenants"),
        }}
      />

      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Condomínio Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="condo-name">Condomínio Name *</Label>
                <Input
                  id="condo-name"
                  value={condoName}
                  onChange={(e) => setCondoName(e.target.value)}
                  placeholder="e.g., Jardim das Flores"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="jardim-flores"
                    required
                  />
                  <span className="text-muted-foreground whitespace-nowrap">
                    .allecto.app
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                  <span className="text-muted-foreground">Logo</span>
                </div>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Input
                    id="primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <Input
                    id="secondary-color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Syndic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="syndic-name">Syndic Name *</Label>
                <Input
                  id="syndic-name"
                  value={syndicName}
                  onChange={(e) => setSyndicName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="syndic-email">Syndic Email *</Label>
                <Input
                  id="syndic-email"
                  type="email"
                  value={syndicEmail}
                  onChange={(e) => setSyndicEmail(e.target.value)}
                  placeholder="syndic@example.com"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DNS Setup Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Configure DNS CNAME record</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Verify SSL certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Test subdomain accessibility</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onNavigate("tenants")}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Condomínio</Button>
        </div>
      </div>
    </div>
  );
}

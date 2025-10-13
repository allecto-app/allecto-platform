import { useState } from "react";
import { Search, Mail, Building2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { toast } from "sonner";
import { Id } from "../lib/convexGenerated";

interface SupportPageProps {
  onNavigate: (page: string) => void;
  onSelectCondo: (condoId: Id<"condos">) => void;
}

export function SupportPage({ onNavigate, onSelectCondo }: SupportPageProps) {
  const [searchEmail, setSearchEmail] = useState("");
  const [foundResident, setFoundResident] = useState<any>(null);

  const handleFindResident = () => {
    if (!searchEmail) {
      toast.error("Please enter an email address");
      return;
    }

    // Mock search result
    setFoundResident({
      name: "João Silva",
      email: searchEmail,
      condo: "Jardim das Flores",
      subdomain: "jardim-flores",
      condoId: "1",
      status: "active",
    });

    toast.success("Resident found");
  };

  const handleResendOTP = () => {
    toast.success("OTP resent successfully");
  };

  const handleEnterTenantView = () => {
    if (foundResident) {
      onSelectCondo(foundResident.condoId as Id<"condos">);
      onNavigate("dashboard");
      toast.success(`Entered tenant view for ${foundResident.condo}`);
    }
  };

  return (
    <div>
      <PageHeader title="Support Tools" breadcrumb={["Platform", "Support"]} />

      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Find Resident by Email</CardTitle>
            <CardDescription>
              Search for a resident across all condominiums to provide support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="search-email"
                  type="email"
                  placeholder="resident@example.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button onClick={handleFindResident}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>

            {foundResident && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-muted-foreground">Name</div>
                        <div>{foundResident.name}</div>
                      </div>
                      <Badge>
                        {foundResident.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Email</div>
                      <div>{foundResident.email}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Condomínio</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{foundResident.condo}</Badge>
                        <span className="text-muted-foreground">
                          ({foundResident.subdomain})
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEnterTenantView}
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Enter Tenant View
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Mail className="mr-2 h-4 w-4" />
                            Resend OTP
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Resend OTP</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will send a new one-time password to{" "}
                              {foundResident.email}. Continue?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResendOTP}>
                              Send OTP
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common support operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate("tenants")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              View All Tenants
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate("audit")}
            >
              <Search className="mr-2 h-4 w-4" />
              View Global Audit Log
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

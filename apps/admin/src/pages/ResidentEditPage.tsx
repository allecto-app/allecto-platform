import { useState } from "react";
import { Mail } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { Id } from "../lib/convexGenerated";

interface ResidentEditPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
}

export function ResidentEditPage({ onNavigate }: ResidentEditPageProps) {
  const [name, setName] = useState("João Silva");
  const [email, setEmail] = useState("joao@example.com");
  const [phone, setPhone] = useState("(11) 99999-0001");
  const [role, setRole] = useState("Resident");
  const [isActive, setIsActive] = useState(true);
  const [allowEmail, setAllowEmail] = useState(true);
  const [allowSMS, setAllowSMS] = useState(true);
  const [allowPush, setAllowPush] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      toast.success("Resident updated successfully!");
      setTimeout(() => {
        onNavigate("resident-detail");
      }, 1000);
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

  const handleCancel = () => {
    onNavigate("resident-detail");
  };

  const handleSendOTP = () => {
    toast.success("New OTP sent to resident");
  };

  return (
    <div>
      <PageHeader
        title="Edit Resident"
        breadcrumb={["Moradores", "João Silva", "Edit"]}
        primaryAction={{
          label: "Save",
          onClick: handleSave,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: handleCancel,
        }}
      />

      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-destructive">{errors.email}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-destructive">{errors.phone}</p>
              )}
              <p className="text-muted-foreground">
                Format: (XX) XXXXX-XXXX
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Resident">Resident</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Syndic">Syndic</SelectItem>
                  <SelectItem value="Council">Council</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground">
                Defines access level and permissions
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="active-status">Active Status</Label>
                <p className="text-muted-foreground">
                  {isActive
                    ? "Resident can access the system"
                    : "Resident cannot access the system"}
                </p>
              </div>
              <Switch
                id="active-status"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-email"
                checked={allowEmail}
                onCheckedChange={(checked) => setAllowEmail(checked as boolean)}
              />
              <label
                htmlFor="allow-email"
                className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allow Email Notifications
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-sms"
                checked={allowSMS}
                onCheckedChange={(checked) => setAllowSMS(checked as boolean)}
              />
              <label
                htmlFor="allow-sms"
                className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allow SMS Notifications
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-push"
                checked={allowPush}
                onCheckedChange={(checked) => setAllowPush(checked as boolean)}
              />
              <label
                htmlFor="allow-push"
                className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allow Push Notifications
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Created</div>
                <div>15/12/2024 10:30</div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Updated</div>
                <div>08/01/2025 14:15</div>
              </div>
            </div>
            <Button variant="outline" onClick={handleSendOTP}>
              <Mail className="mr-2 h-4 w-4" />
              Send New OTP
            </Button>
            <p className="text-muted-foreground">
              This will send a new one-time password to the resident's email
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Trash2, Users } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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

interface UnitEditPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
}

export function UnitEditPage({ onNavigate }: UnitEditPageProps) {
  const [code, setCode] = useState("101");
  const [block, setBlock] = useState("A");
  const [floor, setFloor] = useState("1");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = "Unit code is required";
    }
    if (!block.trim()) {
      newErrors.block = "Block is required";
    }
    if (!floor.trim()) {
      newErrors.floor = "Floor is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      toast.success("Unit updated successfully!");
      setTimeout(() => {
        onNavigate("unit-detail");
      }, 1000);
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

  const handleCancel = () => {
    onNavigate("unit-detail");
  };

  const handleDelete = () => {
    toast.success("Unit deleted successfully!");
    setTimeout(() => {
      onNavigate("units");
    }, 1000);
  };

  return (
    <div>
      <PageHeader
        title="Edit Unit"
        breadcrumb={["Unidades", "A-101", "Edit"]}
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
            <CardTitle>Unit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="code">Unit Code *</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={errors.code ? "border-destructive" : ""}
                />
                {errors.code && (
                  <p className="text-destructive">{errors.code}</p>
                )}
                <p className="text-muted-foreground">e.g., 101, 202</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="block">Block *</Label>
                <Input
                  id="block"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className={errors.block ? "border-destructive" : ""}
                />
                {errors.block && (
                  <p className="text-destructive">{errors.block}</p>
                )}
                <p className="text-muted-foreground">e.g., A, B, C</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor *</Label>
                <Input
                  id="floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className={errors.floor ? "border-destructive" : ""}
                />
                {errors.floor && (
                  <p className="text-destructive">{errors.floor}</p>
                )}
                <p className="text-muted-foreground">Floor number</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linked Residents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div>2 residents linked</div>
                  <div className="text-muted-foreground">
                    João Silva (owner), Maria Silva (tenant)
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => onNavigate("unit-detail")}>
                Manage
              </Button>
            </div>
            <p className="mt-2 text-muted-foreground">
              Go to unit detail page to add or remove residents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Created</div>
                <div>01/11/2024 15:20</div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Updated</div>
                <div>05/01/2025 10:45</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Unit
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Unit</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete unit {code}? This action cannot be
                  undone. All linked residents will lose access to this unit.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

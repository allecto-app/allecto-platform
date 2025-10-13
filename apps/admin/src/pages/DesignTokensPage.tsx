import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { PageHeader } from "../components/layout/PageHeader";

const colorTokens = [
  { name: "--primary", value: "#042940", description: "Primary brand color" },
  { name: "--secondary", value: "#9FC131", description: "Secondary brand color" },
  { name: "--accent", value: "#005C53", description: "Accent color" },
  { name: "--highlight", value: "#DBF227", description: "Highlight color" },
  { name: "--neutral", value: "#D6D58E", description: "Neutral color" },
  { name: "--bg", value: "#FFFFFF", description: "Background" },
  { name: "--surface", value: "#F8FAFC", description: "Surface/Card background" },
  { name: "--text", value: "#0F172A", description: "Primary text" },
  { name: "--text-muted", value: "#475569", description: "Muted text" },
  { name: "--border", value: "#E2E8F0", description: "Border color" },
  { name: "--danger", value: "#DC2626", description: "Error/Danger" },
  { name: "--warning", value: "#F59E0B", description: "Warning" },
  { name: "--success", value: "#16A34A", description: "Success" },
  { name: "--info", value: "#2563EB", description: "Info" },
];

const spacingScale = [4, 8, 12, 16, 20, 24, 32];
const radiusScale = [
  { name: "sm", value: "6px" },
  { name: "md", value: "10px" },
  { name: "lg", value: "16px" },
];

const shadowScale = [
  { name: "sm", value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
  { name: "md", value: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
];

export function DesignTokensPage() {
  return (
    <div>
      <PageHeader title="Design Tokens" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colorTokens.map((color) => (
                <div key={color.name} className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="min-w-0">
                    <div className="font-mono">{color.name}</div>
                    <div className="text-muted-foreground">{color.value}</div>
                    <div className="text-muted-foreground truncate">
                      {color.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-md bg-muted p-4">
              <p className="text-muted-foreground">
                <strong>Tailwind mapping:</strong> These colors map to Tailwind CSS
                variables for consistency across the design system.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spacing Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {spacingScale.map((size) => (
                <div key={size} className="flex items-center gap-4">
                  <div className="w-16 text-muted-foreground">{size}px</div>
                  <div
                    className="h-8 bg-primary"
                    style={{ width: `${size}px` }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Border Radius</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {radiusScale.map((radius) => (
                <div key={radius.name} className="text-center">
                  <div
                    className="mb-2 h-16 w-16 bg-primary"
                    style={{ borderRadius: radius.value }}
                  />
                  <div>{radius.name}</div>
                  <div className="text-muted-foreground">{radius.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shadows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {shadowScale.map((shadow) => (
                <div key={shadow.name} className="text-center">
                  <div
                    className="mb-2 h-16 w-16 bg-white"
                    style={{ boxShadow: shadow.value }}
                  />
                  <div>{shadow.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h1>Heading 1 - 32px</h1>
            </div>
            <div>
              <h2>Heading 2 - 28px</h2>
            </div>
            <div>
              <h3>Heading 3 - 24px</h3>
            </div>
            <div>
              <h4>Heading 4 - 20px</h4>
            </div>
            <div>
              <p>Body text - 16px - Regular weight with 1.5 line height</p>
            </div>
            <div>
              <p className="text-muted-foreground">
                Caption/Muted text - 14px - Muted color for secondary information
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

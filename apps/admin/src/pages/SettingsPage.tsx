import { PageHeader } from "../components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { SettingsBrandingPage } from "./SettingsBrandingPage";
import { SettingsCondoPage } from "./SettingsCondoPage";

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Configurações" />

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="condo">Condomínio</TabsTrigger>
        </TabsList>
        <TabsContent value="branding">
          <SettingsBrandingPage />
        </TabsContent>
        <TabsContent value="condo">
          <SettingsCondoPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

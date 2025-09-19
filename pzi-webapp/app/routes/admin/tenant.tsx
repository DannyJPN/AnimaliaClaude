import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { json, redirect } from "react-router";
import { useLoaderData, Form, useActionData, useSubmit } from "react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

interface TenantData {
  id: number;
  name: string;
  displayName: string;
  subdomain: string;
  isActive: boolean;
  createdAt: string;
  maxUsers: number;
  maxSpecimens: number;
  storageQuotaMB: number;
  configuration?: {
    timeZone?: string;
    defaultLanguage?: string;
    dateFormat?: string;
    currency?: string;
    enableJournalWorkflow?: boolean;
    enableSpecimenDocuments?: boolean;
    enableContractManagement?: boolean;
    enableImageUpload?: boolean;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

interface LoaderData {
  tenant: TenantData;
  isAdmin: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Get current tenant information
  const response = await fetch(`${process.env.API_URL}/api/tenants/current`, {
    headers: {
      'Authorization': request.headers.get('Authorization') || '',
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Response("Access denied", { status: 403 });
    }
    throw new Response("Failed to load tenant data", { status: 500 });
  }

  const tenant = await response.json() as TenantData;

  // Check if user is admin (simplified - would normally check JWT claims)
  const authHeader = request.headers.get('Authorization');
  const isAdmin = authHeader?.includes('admin') || false; // Simplified check

  return json<LoaderData>({ tenant, isAdmin });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "updateConfig") {
    const config = {
      displayName: formData.get("displayName"),
      configuration: {
        timeZone: formData.get("timeZone"),
        defaultLanguage: formData.get("defaultLanguage"),
        dateFormat: formData.get("dateFormat"),
        currency: formData.get("currency"),
        enableJournalWorkflow: formData.get("enableJournalWorkflow") === "on",
        enableSpecimenDocuments: formData.get("enableSpecimenDocuments") === "on",
        enableContractManagement: formData.get("enableContractManagement") === "on",
        enableImageUpload: formData.get("enableImageUpload") === "on",
      },
      theme: {
        primaryColor: formData.get("primaryColor"),
        secondaryColor: formData.get("secondaryColor"),
        backgroundColor: formData.get("backgroundColor"),
        textColor: formData.get("textColor"),
      }
    };

    const response = await fetch(`${process.env.API_URL}/api/tenants/current/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      return json({ error: "Failed to update tenant configuration" });
    }

    return json({ success: "Tenant configuration updated successfully" });
  }

  return json({ error: "Unknown action" });
}

export default function TenantAdmin() {
  const { tenant, isAdmin } = useLoaderData<LoaderData>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const submit = useSubmit();

  const [config, setConfig] = useState({
    displayName: tenant.displayName || '',
    timeZone: tenant.configuration?.timeZone || 'UTC',
    defaultLanguage: tenant.configuration?.defaultLanguage || 'en',
    dateFormat: tenant.configuration?.dateFormat || 'yyyy-MM-dd',
    currency: tenant.configuration?.currency || 'CZK',
    enableJournalWorkflow: tenant.configuration?.enableJournalWorkflow ?? true,
    enableSpecimenDocuments: tenant.configuration?.enableSpecimenDocuments ?? true,
    enableContractManagement: tenant.configuration?.enableContractManagement ?? true,
    enableImageUpload: tenant.configuration?.enableImageUpload ?? true,
    primaryColor: tenant.theme?.primaryColor || '#2E7D32',
    secondaryColor: tenant.theme?.secondaryColor || '#1976D2',
    backgroundColor: tenant.theme?.backgroundColor || '#FFFFFF',
    textColor: tenant.theme?.textColor || '#000000',
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('_action', 'updateConfig');
    submit(formData, { method: 'post' });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tenant Administration</h1>
          <p className="text-muted-foreground">
            Manage your organization's settings and configuration
          </p>
        </div>

        {actionData?.error && (
          <Alert variant="destructive">
            <AlertDescription>{actionData.error}</AlertDescription>
          </Alert>
        )}

        {actionData?.success && (
          <Alert>
            <AlertDescription>{actionData.success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-sm font-medium">Organization Name</Label>
                <p className="text-sm text-muted-foreground">{tenant.displayName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Subdomain</Label>
                <p className="text-sm text-muted-foreground">{tenant.subdomain}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">{new Date(tenant.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm text-muted-foreground">
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Limits</CardTitle>
              <CardDescription>Current limits for your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-sm font-medium">Max Users</Label>
                <p className="text-sm text-muted-foreground">{tenant.maxUsers}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Max Specimens</Label>
                <p className="text-sm text-muted-foreground">{tenant.maxSpecimens}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Storage Quota</Label>
                <p className="text-sm text-muted-foreground">{tenant.storageQuotaMB} MB</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {(isAdmin || true) && ( // Allow curators and admins to edit config
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Customize settings for your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <Form onSubmit={handleSubmit}>
                <input type="hidden" name="_action" value="updateConfig" />

                <Tabs defaultValue="general" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="theme">Theme</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          name="displayName"
                          value={config.displayName}
                          onChange={(e) => setConfig(prev => ({ ...prev, displayName: e.target.value }))}
                          placeholder="Organization Display Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeZone">Time Zone</Label>
                        <Input
                          id="timeZone"
                          name="timeZone"
                          value={config.timeZone}
                          onChange={(e) => setConfig(prev => ({ ...prev, timeZone: e.target.value }))}
                          placeholder="UTC"
                        />
                      </div>
                      <div>
                        <Label htmlFor="defaultLanguage">Default Language</Label>
                        <Input
                          id="defaultLanguage"
                          name="defaultLanguage"
                          value={config.defaultLanguage}
                          onChange={(e) => setConfig(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                          placeholder="en"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <Input
                          id="dateFormat"
                          name="dateFormat"
                          value={config.dateFormat}
                          onChange={(e) => setConfig(prev => ({ ...prev, dateFormat: e.target.value }))}
                          placeholder="yyyy-MM-dd"
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Input
                          id="currency"
                          name="currency"
                          value={config.currency}
                          onChange={(e) => setConfig(prev => ({ ...prev, currency: e.target.value }))}
                          placeholder="CZK"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableJournalWorkflow">Journal Workflow</Label>
                          <p className="text-sm text-muted-foreground">Enable journal entry workflow and approvals</p>
                        </div>
                        <Switch
                          id="enableJournalWorkflow"
                          name="enableJournalWorkflow"
                          checked={config.enableJournalWorkflow}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableJournalWorkflow: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableSpecimenDocuments">Specimen Documents</Label>
                          <p className="text-sm text-muted-foreground">Allow document management for specimens</p>
                        </div>
                        <Switch
                          id="enableSpecimenDocuments"
                          name="enableSpecimenDocuments"
                          checked={config.enableSpecimenDocuments}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableSpecimenDocuments: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableContractManagement">Contract Management</Label>
                          <p className="text-sm text-muted-foreground">Enable contract and partner management features</p>
                        </div>
                        <Switch
                          id="enableContractManagement"
                          name="enableContractManagement"
                          checked={config.enableContractManagement}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableContractManagement: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableImageUpload">Image Upload</Label>
                          <p className="text-sm text-muted-foreground">Allow image uploads for specimens</p>
                        </div>
                        <Switch
                          id="enableImageUpload"
                          name="enableImageUpload"
                          checked={config.enableImageUpload}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableImageUpload: checked }))}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="theme" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            name="primaryColor"
                            type="color"
                            value={config.primaryColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.primaryColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                            placeholder="#2E7D32"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            name="secondaryColor"
                            type="color"
                            value={config.secondaryColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.secondaryColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            placeholder="#1976D2"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="backgroundColor">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="backgroundColor"
                            name="backgroundColor"
                            type="color"
                            value={config.backgroundColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            placeholder="#FFFFFF"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="textColor">Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="textColor"
                            name="textColor"
                            type="color"
                            value={config.textColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, textColor: e.target.value }))}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.textColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, textColor: e.target.value }))}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4">
                  <Button type="submit">Save Changes</Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
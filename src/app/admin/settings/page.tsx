import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage application settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Settings page is under construction.</p>
            </CardContent>
        </Card>
    )
}

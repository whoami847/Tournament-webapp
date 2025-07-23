
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Monitor, Sun, Moon, Bell, Languages } from 'lucide-react';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [pushNotifications, setPushNotifications] = useState(false);

    return (
        <div className="container mx-auto px-4 py-8 md:pb-8 pb-24">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{t('SettingsPage.title')}</h1>
                <p className="text-muted-foreground mt-2">{t('SettingsPage.description')}</p>
            </header>
            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('SettingsPage.appearanceTitle')}</CardTitle>
                        <CardDescription>
                            {t('SettingsPage.appearanceDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="theme" className="flex items-center gap-3">
                                <span className="p-2 bg-muted rounded-full">
                                    {theme === 'light' ? <Sun className="h-5 w-5" /> : theme === 'dark' ? <Moon className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                                </span>
                                <div>
                                    <p className="font-semibold">{t('SettingsPage.themeLabel')}</p>
                                    <p className="text-xs text-muted-foreground">{t('SettingsPage.themeDescription')}</p>
                                </div>
                            </Label>
                            <Select value={theme} onValueChange={setTheme}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">{t('SettingsPage.themeLight')}</SelectItem>
                                    <SelectItem value="dark">{t('SettingsPage.themeDark')}</SelectItem>
                                    <SelectItem value="system">{t('SettingsPage.themeSystem')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('SettingsPage.languageRegionTitle')}</CardTitle>
                        <CardDescription>
                            {t('SettingsPage.languageRegionDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="flex items-center justify-between">
                            <Label htmlFor="language" className="flex items-center gap-3">
                                <span className="p-2 bg-muted rounded-full">
                                    <Languages className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="font-semibold">{t('SettingsPage.languageLabel')}</p>
                                    <p className="text-xs text-muted-foreground">{t('SettingsPage.languageDescription')}</p>
                                </div>
                            </Label>
                             <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">{t('SettingsPage.languageEnglish')}</SelectItem>
                                    <SelectItem value="bn">{t('SettingsPage.languageBengali')}</SelectItem>
                                    <SelectItem value="hi">{t('SettingsPage.languageHindi')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('SettingsPage.notificationsTitle')}</CardTitle>
                        <CardDescription>
                            {t('SettingsPage.notificationsDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="flex items-center justify-between">
                            <Label htmlFor="push-notifications" className="flex items-center gap-3">
                                <span className="p-2 bg-muted rounded-full">
                                    <Bell className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="font-semibold">{t('SettingsPage.pushNotificationsLabel')}</p>
                                    <p className="text-xs text-muted-foreground">{t('SettingsPage.pushNotificationsDescription')}</p>
                                </div>
                            </Label>
                            <Switch 
                                id="push-notifications"
                                checked={pushNotifications}
                                onCheckedChange={setPushNotifications}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

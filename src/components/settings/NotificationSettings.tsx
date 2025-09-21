'use client';

import { useSettings } from '../../contexts/SettingsContext';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Briefcase, Bot, Monitor, Mail, Volume2, Bell } from 'lucide-react';

export function NotificationSettings() {
  const { settings, updateSettings } = useSettings();

  if (!settings) return null;

  return (
    <div className="space-y-8">
      {/* Job Notifications */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Background Jobs</h3>
            <p className="text-sm text-gray-600">Get notified about builds, deployments, and tasks</p>
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  Job Completion Alerts
                </Label>
                <p className="text-sm text-gray-600">Notify when builds and deployments finish</p>
              </div>
              <Switch
                checked={settings.job_notifications}
                onCheckedChange={(checked) => updateSettings({ job_notifications: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Notifications */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600">Configure notifications for AI interactions</p>
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-purple-600" />
                  Sound Alerts
                </Label>
                <p className="text-sm text-gray-600">Play sound when AI responds to messages</p>
              </div>
              <Switch
                checked={settings.ai_sound_alerts}
                onCheckedChange={(checked) => updateSettings({ ai_sound_alerts: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Notifications */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Desktop & Browser</h3>
            <p className="text-sm text-gray-600">Control desktop and browser notifications</p>
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-green-600" />
                  Desktop Notifications
                </Label>
                <p className="text-sm text-gray-600">Show desktop alerts for important events</p>
              </div>
              <Switch
                checked={settings.desktop_notifications}
                onCheckedChange={(checked) => updateSettings({ desktop_notifications: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Notifications */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-600">Manage email alerts and summaries</p>
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-orange-600" />
                  Weekly Digest
                </Label>
                <p className="text-sm text-gray-600">Receive weekly summary of activity and projects</p>
              </div>
              <Switch
                checked={settings.email_weekly_digest}
                onCheckedChange={(checked) => updateSettings({ email_weekly_digest: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
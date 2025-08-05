import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  AlertTriangle,
  FileCheck,
  Search,
  Plus,
  Clock,
  User,
} from "lucide-react";
import SendMessageModal from "@/components/modals/SendMessageAlertModal";
import { useAppData } from "@/hooks/useAppData";

export default function Communication() {
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const { personnel } = useAppData();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Communication Center
          </h1>
          <p className="text-muted-foreground">
            Manage messages, alerts, and circulars
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowSendMessageModal(true)}
          >
            <MessageSquare className="w-4 h-4" />
            Send Message/Alert
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communications and alerts..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Communication Tabs */}
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="circulars" className="gap-2">
            <FileCheck className="w-4 h-4" />
            Circulars
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-6" />
              <h3 className="text-lg font-semibold mb-2">No Messages Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Start communicating with your team. Send messages to individual
                personnel or groups.
              </p>
              <Button
                className="gap-2"
                onClick={() => setShowSendMessageModal(true)}
              >
                <Plus className="w-4 h-4" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="w-16 h-16 text-muted-foreground/50 mb-6" />
              <h3 className="text-lg font-semibold mb-2">No Alerts Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Send urgent alerts to personnel for immediate attention and
                action.
              </p>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setShowSendMessageModal(true)}
              >
                <AlertTriangle className="w-4 h-4" />
                Send Alert
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circulars" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileCheck className="w-16 h-16 text-muted-foreground/50 mb-6" />
              <h3 className="text-lg font-semibold mb-2">No Circulars Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Disseminate official circulars and notices to all personnel for
                reading and acknowledgment.
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowSendMessageModal(true)}
              >
                <Plus className="w-4 h-4" />
                Create Circular
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <SendMessageModal
        open={showSendMessageModal}
        onOpenChange={setShowSendMessageModal}
      />
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SMSTestButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testSMS = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelIds: ["test"], // This will fail gracefully but test SMS function
          subject: "SMS Test",
          message: "This is a test SMS from MADPC system. If you receive this, SMS is working!",
          channels: ["sms"]
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "✅ SMS Test Sent",
          description: "Check your phone for the test message",
          duration: 5000,
        });
      } else {
        toast({
          title: "❌ SMS Test Failed", 
          description: data.error || "SMS configuration issue",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (e: any) {
      toast({
        title: "❌ SMS Test Error",
        description: e?.message || "Failed to test SMS",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={testSMS} 
      disabled={loading}
      variant="outline" 
      size="sm" 
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageSquare className="w-4 h-4" />
      )}
      Test SMS
    </Button>
  );
}

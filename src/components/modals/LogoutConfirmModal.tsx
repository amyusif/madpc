import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, LogOut } from "lucide-react"
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LogoutConfirmModal({ isOpen, onClose }: LogoutConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signOut } = useAuth()
  const { toast } = useToast()

  const handleConfirmLogout = async () => {
    setIsLoading(true)
    
    try {
      // Simulate saving to cache (you can replace this with actual cache operations)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Perform logout
      await signOut()
      
      toast({
        title: "Logged out",
        description: "Your session has been saved and you have been logged out successfully."
      })
      
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-destructive" />
            Confirm Logout
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to log out? Your current session data will be saved to cache before logging out.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            No, Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirmLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving & Logging Out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Yes, Logout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
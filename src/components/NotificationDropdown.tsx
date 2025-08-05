import { useState } from 'react'
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: string
  title: string
  timestamp: string
  type?: 'case' | 'duty' | 'emergency' | 'general'
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New case assigned: Case #2024-001',
    timestamp: '5 min ago',
    type: 'case'
  },
  {
    id: '2',
    title: 'Duty roster updated for tomorrow',
    timestamp: '1 hour ago',
    type: 'duty'
  },
  {
    id: '3',
    title: 'Emergency alert from Unit 3',
    timestamp: '2 hours ago',
    type: 'emergency'
  }
]

export function NotificationDropdown() {
  const [notifications] = useState<Notification[]>(mockNotifications)
  const unreadCount = notifications.length

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'case':
        return '📋'
      case 'duty':
        return '📅'
      case 'emergency':
        return '🚨'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'emergency':
        return 'text-red-600'
      case 'case':
        return 'text-blue-600'
      case 'duty':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
              <div className="flex items-start gap-3 w-full">
                <span className="text-lg mt-0.5">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.timestamp}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        )}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center cursor-pointer">
              <span className="text-sm text-primary">View all notifications</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
"use client"

import { User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { modernTheme } from "@/lib/theme"

export function UserMenu() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-purple-300 transition-all">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || undefined} alt={user?.email || "User"} />
            <AvatarFallback className={`${modernTheme.colors.primary} text-white ${modernTheme.typography.heading}`}>
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`w-56 ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.shadow} ${modernTheme.container.radius}`} align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className={`text-sm ${modernTheme.typography.heading}`}>{user?.displayName || "Usuario"}</p>
            <p className={`text-xs ${modernTheme.colors.muted}`}>{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-purple-200/30" />
        <DropdownMenuItem onClick={() => router.push("/profile")} className={`cursor-pointer ${modernTheme.effects.transition} hover:bg-purple-100/50`}>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-purple-200/30" />
        <DropdownMenuItem onClick={signOut} className={`cursor-pointer text-red-600 ${modernTheme.effects.transition} hover:bg-red-50/50`}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

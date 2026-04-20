"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Users, ExternalLink, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { getDiscordWidgetData } from "@/app/actions/discord"

interface DiscordWidgetProps {
  serverId?: string
  inviteUrl?: string
}

interface DiscordMember {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  status: string
  avatar_url: string
  game?: {
    name: string
  }
}

interface DiscordData {
  id: string
  name: string
  instant_invite: string | null
  presence_count: number
  members: DiscordMember[]
}



export function DiscordCommunityWidget({ serverId, inviteUrl = "https://discord.gg/your-server" }: DiscordWidgetProps) {
  const [data, setData] = useState<DiscordData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!serverId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const result = await getDiscordWidgetData(serverId)
        if (result.success) {
          setData(result.data)
          setError(false)
        } else {
          setError(true)
        }
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [serverId])

  if (!serverId) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full font-sans"
    >
      <div className="bg-white rounded-2xl shadow-xl shadow-indigo-500/10 border border-indigo-100 overflow-hidden flex flex-col h-[400px]">
        {/* Header */}
        <div className="bg-[#5865F2] p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight" suppressHydrationWarning>
                {data?.name || "Discord Community"}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${error ? 'bg-red-400' : 'bg-green-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${error ? 'bg-red-500' : 'bg-green-500'}`}></span>
                </div>
                <span className="text-xs text-indigo-100 font-medium" suppressHydrationWarning>
                  {loading ? "กำลังโหลด..." : error ? "ไม่สามารถโหลดข้อมูลได้" : `${data?.presence_count || 0} ออนไลน์`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-2 bg-[#F2F3F5] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="text-xs">กำลังโหลดสมาชิก...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 p-4 text-center">
              <MessageCircle className="h-8 w-8 text-gray-300" />
              <span className="text-xs">ไม่สามารถเชื่อมต่อกับ Discord ได้</span>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => window.open(inviteUrl, '_blank', 'noopener,noreferrer')}
              >
                เข้าร่วมผ่านลิ้งค์
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="px-2 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
                สมาชิกออนไลน์ ({data?.members.length})
              </p>
              {data?.members.map((member) => (
                <div
                  key={member.id}
                  className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-all duration-200 hover:shadow-sm"
                >
                  <div className="relative shrink-0">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-200 ring-2 ring-transparent group-hover:ring-indigo-100 transition-all">
                      {member.avatar_url && (
                        <Image
                          src={member.avatar_url}
                          alt={member.username}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      )}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#F2F3F5] group-hover:border-white ${member.status === "online" ? "bg-green-500" :
                      member.status === "idle" ? "bg-yellow-500" :
                        member.status === "dnd" ? "bg-red-500" : "bg-gray-500"
                      }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-[#5865F2] transition-colors">
                        {member.username}
                      </p>
                    </div>
                    {member.game && (
                      <p className="text-[10px] text-gray-500 truncate">
                        กำลังเล่น {member.game.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-gray-100 shrink-0">
          <a
            href={data?.instant_invite || inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium shadow-lg shadow-indigo-500/20 transition-all h-10 rounded-xl">
              เข้าร่วมเซิร์ฟเวอร์
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>

      <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
    </motion.div>
  )
}
